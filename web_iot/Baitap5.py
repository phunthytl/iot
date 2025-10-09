import numpy as np
import pandas as pd
from scipy import stats

# ===================================
# 1️⃣ TẠO DỮ LIỆU MẪU
# ===================================
data = pd.DataFrame({
    'ChieuCao': [168, 172, 170, 165, 177, 169, 174, 171, 166, 173]
})

# In dữ liệu ban đầu
print("=== DỮ LIỆU BAN ĐẦU (Chiều cao - cm) ===")
print(data)

# Giả thuyết kiểm định
H0 = 170
print(f"\n=== GIẢ THUYẾT CẦN KIỂM ĐỊNH ===")
print(f"H₀: Trung bình quần thể = {H0} cm")
print(f"H₁: Trung bình quần thể ≠ {H0} cm")

# ===================================
# 2️⃣ CHUẨN HÓA DỮ LIỆU
# ===================================
trung_binh = data['ChieuCao'].mean()
do_lech_chuan = data['ChieuCao'].std(ddof=1)
data['ChuanHoa'] = (data['ChieuCao'] - trung_binh) / do_lech_chuan

print("\n=== DỮ LIỆU SAU KHI CHUẨN HÓA ===")
print(data)

# ===================================
# 3️⃣ ƯỚC LƯỢNG KHOẢNG TIN CẬY 95% CHO TRUNG BÌNH
# ===================================
muc_tin_cay = 0.95
n = len(data['ChieuCao'])
sai_so_chuan = do_lech_chuan / np.sqrt(n)

# Tính khoảng tin cậy theo phân phối t
khoang_tin_cay = stats.t.interval(muc_tin_cay, df=n-1, loc=trung_binh, scale=sai_so_chuan)

print("\n=== KHOẢNG TIN CẬY 95% CHO TRUNG BÌNH ===")
print(f"({khoang_tin_cay[0]:.2f}, {khoang_tin_cay[1]:.2f}) cm")

# ===================================
# 4️⃣ KIỂM ĐỊNH GIẢ THUYẾT THỐNG KÊ
# ===================================
t_thong_ke, p_gia_tri = stats.ttest_1samp(data['ChieuCao'], H0)

print("\n=== KẾT QUẢ KIỂM ĐỊNH GIẢ THUYẾT ===")
print(f"Giá trị t = {t_thong_ke:.4f}")
print(f"Giá trị p = {p_gia_tri:.4f}")

if p_gia_tri < 0.05:
    print("➡️ Bác bỏ H₀: Trung bình KHÁC 170 cm (có ý nghĩa thống kê ở mức 5%)")
else:
    print("➡️ Không bác bỏ H₀: Không có bằng chứng cho thấy trung bình khác 170 cm")

# ===================================
# 5️⃣ TỔNG KẾT NGẮN GỌN
# ===================================
print("\n=== TỔNG KẾT ===")
print(f"Trung bình mẫu: {trung_binh:.2f} cm")
print(f"Độ lệch chuẩn: {do_lech_chuan:.2f}")
print(f"Số lượng mẫu: {n}")
