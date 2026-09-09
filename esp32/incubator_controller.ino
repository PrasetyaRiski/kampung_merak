#include <WiFi.h>
#include <WiFiClientSecure.h> 
#include <PubSubClient.h>
#include <Wire.h>
#include "Adafruit_SHT31.h"

// ================= KONEKSI & KREDENSIAL HIVEMQ CLOUD =================
const char* ssid          = "Pribadi";
const char* password      = "pribadi1";

const char* mqtt_server   = "9170ac9caae04bc598c6d6111adfa4a1.s1.eu.hivemq.cloud";
const int mqtt_port       = 8883;

const char* mqtt_user     = "endoqmerak";
const char* mqtt_password = "Admin123";

// ================= KONFIGURASI JEMBATAN RTSP BARDI =================
// IP lokal Kamera Bardi di jaringan WiFi rumah
const char* bardi_ip      = "192.168.110.227"; 
const uint16_t bardi_port = 554;

// Alamat server VPS relay
const char* server_host   = "76.76.76.188"; 
const uint16_t server_port= 9000; // Port listener relay di server

WiFiClient clientBardi;
WiFiClient clientServer;

// ================= PIN DEFINITION =================
#define PIN_LAMP   25
#define PIN_MIST   27

#define RELAY_ON   LOW
#define RELAY_OFF  HIGH

// ================= INSTANSIASI OBJEK =================
WiFiClientSecure espClient; 
PubSubClient client(espClient);
Adafruit_SHT31 sht30 = Adafruit_SHT31();

// ================= VARIABEL KONTROL & LOGIKA =================
float temperature = 0.0;
float humidity    = 0.0;

bool sensorDetected = false;
bool sensorValid    = false;

float temp_thresh_on  = 37.5; 
float temp_thresh_off = 38.0; 
String lamp_mode      = "AUTO"; 

enum MistState { MIST_IDLE, MIST_RUNNING, MIST_COOLDOWN };
MistState mistState = MIST_IDLE;
unsigned long mistTimer = 0;
const unsigned long MIST_RUN_DURATION = 3000;      
const unsigned long MIST_COOLDOWN_DURATION = 30000; 

unsigned long last_publish_time = 0;
const unsigned long PUBLISH_INTERVAL = 5000; 

unsigned long last_sensor_time = 0;
const unsigned long SENSOR_INTERVAL = 2000; 

unsigned long last_reconnect_attempt = 0; 

// ================= MQTT TOPICS =================
const char* topic_telemetry_temp   = "iot/telemetry/temperature";
const char* topic_telemetry_humi   = "iot/telemetry/humidity";
const char* topic_telemetry_lamp   = "iot/telemetry/status_lamp";
const char* topic_telemetry_mist   = "iot/telemetry/status_mist";
const char* topic_telemetry_sensor = "iot/telemetry/status_sensor"; 

const char* topic_cmd_thresh_on   = "iot/cmd/lamp_thresh_on";
const char* topic_cmd_thresh_off  = "iot/cmd/lamp_thresh_off";
const char* topic_cmd_lamp_mode   = "iot/cmd/lamp_mode"; 
const char* topic_cmd_mist_trig   = "iot/cmd/mist_trigger";

// ================= TASK FREERTOS: JEMBATAN RTSP (CORE 0) =================
void taskRtspBridge(void * pvParameters) {
  uint8_t buffer[2048];

  while (true) {
    if (WiFi.status() == WL_CONNECTED) {
      // 1. Jika terputus dari Server Relay, bersihkan socket dan sambung ulang
      if (!clientServer.connected()) {
        clientServer.stop();
        clientBardi.stop();
        clientServer.connect(server_host, server_port);
        vTaskDelay(500 / portTICK_PERIOD_MS);
        continue;
      }

      // 2. Jika terputus dari Kamera Bardi, bersihkan socket dan sambung ulang
      if (!clientBardi.connected()) {
        clientBardi.stop();
        clientBardi.connect(bardi_ip, bardi_port);
        vTaskDelay(500 / portTICK_PERIOD_MS);
        continue;
      }

      // 3. Teruskan data stream dari Kamera Bardi -> Server Relay
      while (clientBardi.available() && clientServer.connected()) {
        int bytesRead = clientBardi.read(buffer, sizeof(buffer));
        if (bytesRead > 0) {
          clientServer.write(buffer, bytesRead);
        }
      }

      // 4. Teruskan perintah RTSP handshake dari Server Relay -> Kamera Bardi
      while (clientServer.available() && clientBardi.connected()) {
        int bytesRead = clientServer.read(buffer, sizeof(buffer));
        if (bytesRead > 0) {
          clientBardi.write(buffer, bytesRead);
        }
      }
    }
    vTaskDelay(2 / portTICK_PERIOD_MS);
  }
}

void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Menghubungkan ke ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("");
  Serial.println("=========================================");
  Serial.println(">>> Wi-Fi TERHUBUNG SUCCESSFULLY! <<<");
  Serial.print("IP Address ESP32: ");
  Serial.println(WiFi.localIP());
  Serial.println("=========================================");
}

void callback(char* topic, byte* payload, unsigned int length) {
  String message = "";
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("]: ");
  Serial.println(message);

  if (String(topic) == topic_cmd_thresh_on) {
    temp_thresh_on = message.toFloat();
    Serial.print("Updated Temp Thresh ON to: "); Serial.println(temp_thresh_on);
  }
  else if (String(topic) == topic_cmd_thresh_off) {
    temp_thresh_off = message.toFloat();
    Serial.print("Updated Temp Thresh OFF to: "); Serial.println(temp_thresh_off);
  }
  else if (String(topic) == topic_cmd_lamp_mode) {
    if (message == "ON")         lamp_mode = "MANUAL_ON";
    else if (message == "OFF")   lamp_mode = "MANUAL_OFF";
    else                         lamp_mode = "AUTO";
  }
  else if (String(topic) == topic_cmd_mist_trig && message == "TRIGGER") {
    if (mistState == MIST_IDLE) {
      mistState = MIST_RUNNING;
      mistTimer = millis();
      digitalWrite(PIN_MIST, RELAY_ON);
      Serial.println("Mist Maker Triggered Manually!");
    }
  }
}

bool reconnect() {
  Serial.print("Attempting MQTT connection to HiveMQ Cloud...");
  String clientId = "ESP32Client-";
  clientId += String(random(0, 0xffff), HEX);
  
  if (client.connect(clientId.c_str(), mqtt_user, mqtt_password)) {
    Serial.println("connected");
    client.subscribe(topic_cmd_thresh_on);
    client.subscribe(topic_cmd_thresh_off);
    client.subscribe(topic_cmd_lamp_mode);
    client.subscribe(topic_cmd_mist_trig);
    return true;
  } else {
    Serial.print("failed, rc=");
    Serial.print(client.state());
    Serial.println(" will try again in 5 seconds");
    return false;
  }
}

void setup() {
  Serial.begin(115200);
  
  pinMode(PIN_LAMP, OUTPUT);
  pinMode(PIN_MIST, OUTPUT);
  
  digitalWrite(PIN_LAMP, RELAY_OFF);
  digitalWrite(PIN_MIST, RELAY_OFF);

  Wire.begin(21, 22);

  sensorDetected = sht30.begin(0x44);
  if (!sensorDetected) {
    Serial.println("[PERINGATAN] SHT30 tidak terdeteksi. Data telemetry suhu/kelembaban TIDAK akan dikirim sampai sensor terpasang & terbaca.");
  }

  setup_wifi();
  espClient.setInsecure(); 

  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);

  // Jalankan Jembatan RTSP di Core 0 agar tidak mengganggu kontrol inkubator di Core 1
  xTaskCreatePinnedToCore(
    taskRtspBridge,
    "RTSP_Bridge",
    8192,
    NULL,
    1,
    NULL,
    0
  );
}

void loop() {
  unsigned long currentMillis = millis();

  if (!client.connected()) {
    if (currentMillis - last_reconnect_attempt >= 5000) {
      last_reconnect_attempt = currentMillis;
      if (reconnect()) {
        last_reconnect_attempt = 0;
      }
    }
  } else {
    client.loop();
  }

  if (currentMillis - last_sensor_time >= SENSOR_INTERVAL) {
    last_sensor_time = currentMillis;

    if (sensorDetected) {
      float t = sht30.readTemperature();
      float h = sht30.readHumidity();

      if (isnan(t) || isnan(h)) {
        sensorValid = false;
        Serial.println("[ERROR] Gagal membaca SHT30 (NaN). Data suhu/kelembaban tidak diperbarui.");
      } else {
        temperature = t;
        humidity = h;
        sensorValid = true;
      }
    } else {
      sensorValid = false;
    }
  }

  if (lamp_mode == "AUTO") {
    if (sensorValid) {
      if (temperature <= temp_thresh_on) {
        digitalWrite(PIN_LAMP, RELAY_ON);
      } else if (temperature >= temp_thresh_off) {
        digitalWrite(PIN_LAMP, RELAY_OFF);
      }
    }
  } else if (lamp_mode == "MANUAL_ON") {
    digitalWrite(PIN_LAMP, RELAY_ON);
  } else if (lamp_mode == "MANUAL_OFF") {
    digitalWrite(PIN_LAMP, RELAY_OFF);
  }

  switch (mistState) {
    case MIST_IDLE:
      if (sensorValid && humidity < 40.0) {
        mistState = MIST_RUNNING;
        mistTimer = currentMillis;
        digitalWrite(PIN_MIST, RELAY_ON);
      }
      break;

    case MIST_RUNNING:
      if (currentMillis - mistTimer >= MIST_RUN_DURATION) {
        digitalWrite(PIN_MIST, RELAY_OFF);
        mistState = MIST_COOLDOWN;
        mistTimer = currentMillis;
      }
      break;

    case MIST_COOLDOWN:
      if (currentMillis - mistTimer >= MIST_COOLDOWN_DURATION) {
        mistState = MIST_IDLE;
      }
      break;
  }

  if (client.connected() && (currentMillis - last_publish_time >= PUBLISH_INTERVAL)) {
    last_publish_time = currentMillis;

    if (sensorValid) {
      client.publish(topic_telemetry_temp, String(temperature, 1).c_str());
      client.publish(topic_telemetry_humi, String(humidity, 1).c_str());
    }

    client.publish(topic_telemetry_sensor, sensorValid ? "OK" : "ERROR");
    client.publish(topic_telemetry_lamp, (digitalRead(PIN_LAMP) == RELAY_ON) ? "ON" : "OFF");
    client.publish(topic_telemetry_mist, (digitalRead(PIN_MIST) == RELAY_ON) ? "ON" : "OFF");

    if (sensorValid) {
      Serial.println("-> Data sensor asli berhasil dikirim ke HiveMQ!");
    } else {
      Serial.println("-> Status ERROR terkirim (suhu/kelembaban di-skip, sensor tidak valid).");
    }
  }
}
