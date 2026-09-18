"""Validasi rantai ID silsilah: induk -> telur -> anak.

Format:
  Breeder F0 : JB01 (jantan) / BB01 (betina)
  Telur/anak : {ID_Jantan}{ID_Betina}-{NN}  contoh: JB01BB02-01
  Chick      : {ID_Telur}-C{NN}             contoh: JB01BB02-01-C01

Aturan edit: prefix warisan dikunci, hanya suffix nomor yang boleh berubah.
ID lama (EGG-001, MRK-..., CHK-...) dilewati validasi agar data lama tetap bisa dibaca.
"""

import re

RE_F0 = re.compile(r"^(JB|BB)(\d{1,3})$")
RE_ANAK = re.compile(r"^(JB\d{1,3})(BB\d{1,3})-(\d{1,3})$")
RE_CHICK = re.compile(r"^(.+)-C(\d{1,3})$")


def is_legacy(obj_id: str) -> bool:
    if not obj_id:
        return True
    return not (RE_F0.match(obj_id) or RE_ANAK.match(obj_id) or RE_CHICK.match(obj_id))


def _fmt(nomor: int) -> str:
    return f"{nomor:02d}"


def next_nomor(existing_ids, ambil_nomor) -> int:
    nums = [n for n in (ambil_nomor(i) for i in existing_ids) if n is not None]
    return (max(nums) + 1) if nums else 1


def nomor_anak(obj_id: str, jantan: str, betina: str):
    m = RE_ANAK.match(obj_id or "")
    if m and m.group(1) == jantan and m.group(2) == betina:
        return int(m.group(3))
    return None


def nomor_chick(obj_id: str, egg_id: str):
    m = RE_CHICK.match(obj_id or "")
    if m and m.group(1) == egg_id:
        return int(m.group(2))
    return None


def nomor_f0(obj_id: str, kode: str):
    m = RE_F0.match(obj_id or "")
    if m and m.group(1) == kode:
        return int(m.group(2))
    return None


def build_telur(jantan: str, betina: str, nomor: int) -> str:
    return f"{jantan}{betina}-{_fmt(nomor)}"


def build_chick(egg_id: str, nomor: int) -> str:
    return f"{egg_id}-C{_fmt(nomor)}"


def build_f0(jenis_kelamin: str, nomor: int) -> str:
    kode = "JB" if str(jenis_kelamin).strip().lower() == "jantan" else "BB"
    return f"{kode}{_fmt(nomor)}"


def prefix_telur(obj_id: str):
    """Kembalikan (jantan, betina) atau None jika legacy/tidak cocok."""
    m = RE_ANAK.match(obj_id or "")
    return (m.group(1), m.group(2)) if m else None


def prefix_chick(obj_id: str):
    m = RE_CHICK.match(obj_id or "")
    return m.group(1) if m else None


def cek_edit_telur(old_id: str, new_id: str):
    old, new = prefix_telur(old_id), prefix_telur(new_id)
    if old and new and old != new:
        raise ValueError(f"Prefix induk dikunci ({old[0]}{old[1]}). Hanya nomor yang boleh diubah.")


def cek_edit_chick(old_id: str, new_id: str):
    old, new = prefix_chick(old_id), prefix_chick(new_id)
    if old and new and old != new:
        raise ValueError(f"Identitas telur dikunci ({old}). Hanya nomor -C yang boleh diubah.")


def cek_edit_breeder(old_id: str, new_id: str):
    mf0_old, mf0_new = RE_F0.match(old_id or ""), RE_F0.match(new_id or "")
    if mf0_old and mf0_new and mf0_old.group(1) != mf0_new.group(1):
        raise ValueError("Kode kelamin dikunci (JB=jantan, BB=betina). Hanya angka yang boleh diubah.")
    old, new = prefix_telur(old_id), prefix_telur(new_id)
    if old and new and old != new:
        raise ValueError("Prefix induk dikunci. Hanya nomor yang boleh diubah.")
