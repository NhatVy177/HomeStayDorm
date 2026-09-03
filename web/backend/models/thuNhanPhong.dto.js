export class HopDongChoThuNhanPhongDTO {
  constructor(row = {}) {
    Object.assign(this, row);
  }

  static fromList(rows = []) {
    return rows.map((row) => new HopDongChoThuNhanPhongDTO(row));
  }
}

export class KhoanThuNhanPhongDTO {
  constructor(data = {}) {
    this.summary = data.summary || null;
    this.details = data.details || [];
  }
}

export class ChiTietThuNhanPhongDTO {
  constructor(data = {}) {
    this.summary = data.summary || null;
    this.details = data.details || [];
  }
}

export class KetQuaThanhToanDTO {
  constructor(result = {}) {
    this.maHoaDon = result.maHoaDon || null;
    this.maLoi = Number(result.maLoi ?? 0);
    this.thongBao = result.thongBao || '';
  }
}

export class KetQuaDieuKienBanGiaoDTO {
  constructor(result = {}) {
    this.hopLe = result.hopLe === true || result.hopLe === 1;
    this.maLoi = Number(result.maLoi ?? 0);
    this.thongBao = result.thongBao || '';
  }
}
