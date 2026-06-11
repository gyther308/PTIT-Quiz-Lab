# PTIT Quiz Lab

Trang web luyện trắc nghiệm lấy câu hỏi từ file JSON.

## Cấu trúc thư mục

```text
├── index.html
├── README.md
├── JavaScript/
│   └── main.js
├── Style/
│   └── main.css
└── Json/
    ├── quiz-list.json
    ├── CNTT/
    │   ├── Ki_1/
    │   │   ├── Nhap_mon_lap_trinh/
    │   │   │   ├── ex1.json
    │   │   │   └── ex2.json
    │   │   └── Tin_hoc_dai_cuong/
    │   │       └── ex1.json
    │   └── Ki_2/
    │       └── Co_so_du_lieu/
    │           └── ex1.json
    └── ATTT/
        └── Ki_1/
            └── Nhap_mon_an_toan_thong_tin/
                └── ex1.json
```

## Cách chạy

Mở terminal tại thư mục dự án rồi chạy:

```bash
python -m http.server 5500
```

Sau đó mở trình duyệt:

```text
http://localhost:5500
```

## Cách chọn đề

Khi mở trang, hệ thống chỉ tải danh sách đề từ `Json/quiz-list.json`, chưa tự chọn bài nào.

Giao diện chọn đề theo thứ tự:

```text
Ngành học → Kì học → Môn học → Bài kiểm tra
```

Ví dụ:

```text
Công nghệ thông tin → Kì 1 → Nhập môn lập trình → Bài 1
```

## Vì sao cần Json/quiz-list.json?

Web tĩnh chạy bằng HTML/CSS/JavaScript không thể tự quét thư mục `Json/` để biết có những file nào. Vì vậy cần một file manifest:

```text
Json/quiz-list.json
```

File này đóng vai trò như danh mục đề.

## Cấu trúc Json/quiz-list.json

```json
{
  "schemaVersion": 2,
  "selectOrder": ["major", "semester", "subject"],
  "quizzes": [
    {
      "id": "cntt-ki1-nmlt-ex1",
      "major": "Công nghệ thông tin",
      "semester": "Kì 1",
      "subject": "Nhập môn lập trình",
      "title": "CNTT - Kì 1 - Nhập môn lập trình",
      "lessonName": "Bài 1: Tổng quan lập trình và tư duy thuật toán",
      "description": "Mô tả ngắn về bài kiểm tra.",
      "path": "./Json/CNTT/Ki_1/Nhap_mon_lap_trinh/ex1.json",
      "questionCount": 3
    }
  ]
}
```

## Cấu trúc file đề JSON

```json
{
  "title": "CNTT - Kì 1 - Nhập môn lập trình",
  "lessonName": "Bài 1: Tổng quan lập trình và tư duy thuật toán",
  "description": "Mô tả ngắn về đề",
  "major": "Công nghệ thông tin",
  "semester": "Kì 1",
  "subject": "Nhập môn lập trình",
  "questions": [
    {
      "id": 1,
      "question": "Nội dung câu hỏi?",
      "type": "single",
      "answers": [
        {
          "text": "Đáp án A",
          "correct": true,
          "explanation": "Vì sao đáp án này đúng hoặc sai."
        },
        {
          "text": "Đáp án B",
          "correct": false,
          "explanation": "Vì sao đáp án này đúng hoặc sai."
        }
      ]
    }
  ]
}
```

## Thêm đề mới

Ví dụ muốn thêm đề:

```text
Công nghệ thông tin → Kì 2 → Cấu trúc dữ liệu và giải thuật → Bài 1
```

Tạo file:

```text
Json/CNTT/Ki_2/Cau_truc_du_lieu_va_giai_thuat/ex1.json
```

Sau đó thêm một mục vào `Json/quiz-list.json`:

```json
{
  "id": "cntt-ki2-ctdlgt-ex1",
  "major": "Công nghệ thông tin",
  "semester": "Kì 2",
  "subject": "Cấu trúc dữ liệu và giải thuật",
  "title": "CNTT - Kì 2 - Cấu trúc dữ liệu và giải thuật",
  "lessonName": "Bài 1: Mảng và danh sách liên kết",
  "description": "Ôn tập mảng, linked list và thao tác cơ bản.",
  "path": "./Json/CNTT/Ki_2/Cau_truc_du_lieu_va_giai_thuat/ex1.json",
  "questionCount": 10
}
```

## Chức năng

- Chọn đề theo 3 cấp: ngành học, kì học, môn học.
- Hiển thị danh sách bài kiểm tra thuộc môn đã chọn.
- Khi mở trang, chưa có ngành/kì/môn/bài nào được chọn; người dùng tự chọn đề cần làm.
- Hiển thị tên bài, ngành, kì, môn trên giao diện.
- Hỗ trợ chọn file JSON ngoài từ máy.
- Hỗ trợ câu hỏi một đáp án đúng và nhiều đáp án đúng.
- Kiểm tra từng câu, hiện giải thích đúng/sai.
- Nộp bài, tính điểm và xem lại đáp án.
- Điều hướng nhanh theo số câu.
- Trộn câu hỏi.


## Cập nhật giao diện v6

- Viết lại bố cục theo hướng dễ dùng hơn: thanh tiêu đề trên cùng, panel chọn đề bên trái, khu vực làm bài ở giữa và điều hướng câu hỏi bên phải.
- Màu sắc được đổi sang tông xanh, kem, tím nhẹ và xanh lá để thân thiện hơn với người dùng.
- Thống kê nhanh được đưa lên đầu trang để dễ quan sát trong lúc làm bài.
- Các dropdown, nút bấm, thẻ đáp án và trạng thái đúng/sai có kích thước lớn hơn, dễ bấm hơn.
- Trạng thái chưa chọn đề được thiết kế lại rõ ràng hơn.
- Giao diện responsive tốt hơn trên laptop, tablet và điện thoại.


## Cập nhật v7: Lưu kết quả bài kiểm tra

- Sau khi bấm **Nộp bài**, kết quả được tự động lưu vào `localStorage` của trình duyệt.
- Sidebar có thêm mục **Lịch sử làm bài** để xem các lượt làm gần đây.
- Mỗi lượt lưu gồm tên bài, ngành, kì, môn, điểm số, phần trăm, thời gian hoàn thành và chi tiết đáp án.
- Có thể bấm **Xuất JSON** để tải lịch sử kết quả về máy.
- Có thể bấm biểu tượng thùng rác để xóa toàn bộ lịch sử đã lưu trên trình duyệt hiện tại.

Lưu ý: `localStorage` lưu theo từng trình duyệt và từng thiết bị. Nếu đổi trình duyệt hoặc xóa dữ liệu web, lịch sử có thể mất. Hãy dùng **Xuất JSON** nếu muốn lưu lâu dài.


## Cập nhật v8: Lưu kết quả vào từng bài kiểm tra

- Kết quả vẫn được lưu bằng `localStorage` của trình duyệt, nhưng được gắn theo `quizPath` của từng bài kiểm tra.
- Trong danh sách **Bài kiểm tra**, mỗi bài đã làm sẽ hiện:
  - Số lượt đã làm
  - Điểm cao nhất
  - Lần làm gần nhất
  - Nút **Xem kết quả**
- Có thể xem lại từng lượt làm ngay từ thẻ bài kiểm tra.
- Lịch sử tổng vẫn được giữ để xuất JSON hoặc xóa toàn bộ khi cần.

Lưu ý: web tĩnh không thể ghi ngược trực tiếp vào file `.json` trên ổ đĩa nếu không có backend. Vì vậy dữ liệu được gắn với bài kiểm tra trong giao diện bằng `localStorage`.


## Hiển thị công thức toán học

Website đã tích hợp MathJax để hiển thị công thức viết bằng LaTeX trong file JSON.

Quy ước nên dùng trong `question`, `answers[].text`, `answers[].explanation`:

```json
{
  "question": "Tính giới hạn \\(\\lim_{(x,y)\\to(0,0)} \\frac{xy\\sin x}{x^2+4y^2}\\).",
  "answers": [
    {
      "text": "\\(L=0\\)",
      "correct": true,
      "explanation": "Vì \\(\\sin x \\sim x\\), nên biểu thức tiến về \\(0\\)."
    }
  ]
}
```

Cách viết:

- Công thức trong dòng: `\\(x^2+y^2=R^2\\)`
- Công thức xuống dòng: `\\[\\int_0^1 x^2\\,dx=\\frac{1}{3}\\]`
- Có thể dùng `$...$` và `$$...$$`, nhưng nên ưu tiên `\\(...\\)` và `\\[...\\]` để tránh nhầm với ký hiệu tiền tệ.

Lưu ý: MathJax đang được tải qua CDN, vì vậy cần có Internet khi mở web. Nếu muốn chạy offline, hãy tải MathJax về project và đổi đường dẫn script trong `index.html`.


## Sửa lỗi MathJax không render công thức

Nếu JSON có công thức dạng:

```json
"question": "Tính \\(\\lim_{x\\to 0} \\frac{\\sin x}{x}\\)"
```

thì web cần gọi lại MathJax sau khi JavaScript render câu hỏi. Bản này đã thêm:

```js
queueMathRender(elements.quizBox);
```

sau mỗi lần render câu hỏi, xem đáp án và xem lại kết quả.

Quy ước viết công thức:

```text
\\( ... \\)     công thức trong dòng
\\[ ... \\]     công thức xuống dòng
```

Ví dụ:

```json
{
  "question": "Cho \\(f(x,y)=\\frac{xy\\sin x}{x^2+4y^2}\\). Tính \\(L=\\lim_{(x,y)\\to(0,0)} f(x,y)\\).",
  "answers": [
    {
      "text": "\\(L=0\\)",
      "correct": true,
      "explanation": "Vì \\(\\sin x \\sim x\\), tử số có bậc cao hơn mẫu."
    }
  ]
}
```
