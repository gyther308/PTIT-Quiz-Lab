const QUIZ_LIST_PATH = "./Json/quiz-list.json";
const RESULT_STORAGE_KEY = "ptit_quiz_lab_results_v1";
const MAX_SAVED_RESULTS = 100;

const state = {
  library: [],
  activeQuizPath: "",
  quiz: null,
  questions: [],
  currentIndex: 0,
  selectedAnswers: [],
  checkedQuestions: [],
  selectedMajor: "",
  selectedSemester: "",
  selectedSubject: "",
  startedAt: null,
  currentResultSaved: false,
  expandedQuizPath: ""
};

const $ = (selector) => document.querySelector(selector);

const elements = {
  lessonName: $("#lessonName"),
  quizTitle: $("#quizTitle"),
  quizDescription: $("#quizDescription"),
  heroBreadcrumb: $("#heroBreadcrumb"),
  heroLessonTitle: $("#heroLessonTitle"),
  heroLessonDescription: $("#heroLessonDescription"),
  majorSelect: $("#majorSelect"),
  semesterSelect: $("#semesterSelect"),
  subjectSelect: $("#subjectSelect"),
  reloadLibraryBtn: $("#reloadLibraryBtn"),
  availableCount: $("#availableCount"),
  quizList: $("#quizList"),
  fileInput: $("#fileInput"),
  resultHistory: $("#resultHistory"),
  historyCount: $("#historyCount"),
  clearHistoryBtn: $("#clearHistoryBtn"),
  exportHistoryBtn: $("#exportHistoryBtn"),
  totalQuestions: $("#totalQuestions"),
  answeredQuestions: $("#answeredQuestions"),
  scorePreview: $("#scorePreview"),
  questionCounter: $("#questionCounter"),
  questionType: $("#questionType"),
  progressFill: $("#progressFill"),
  emptyState: $("#emptyState"),
  quizBox: $("#quizBox"),
  resultBox: $("#resultBox"),
  questionBadge: $("#questionBadge"),
  selectionHint: $("#selectionHint"),
  questionText: $("#questionText"),
  answersContainer: $("#answersContainer"),
  feedbackBox: $("#feedbackBox"),
  submitAnswerBtn: $("#submitAnswerBtn"),
  finishQuizBtn: $("#finishQuizBtn"),
  prevBtn: $("#prevBtn"),
  nextBtn: $("#nextBtn"),
  restartBtn: $("#restartBtn"),
  showReviewBtn: $("#showReviewBtn"),
  resultTitle: $("#resultTitle"),
  resultMessage: $("#resultMessage"),
  reviewList: $("#reviewList"),
  questionNavigator: $("#questionNavigator"),
  shuffleBtn: $("#shuffleBtn"),
  toast: $("#toast"),
  themeToggleBtn: $("#themeToggleBtn"),
  resultScoreCircle: $("#resultScoreCircle"),
  resultPercent: $("#resultScoreCircle .result-percent"),
  resultFraction: $("#resultScoreCircle .result-fraction")
};

function showToast(message, type = "info") {
  let icon = "ℹ️";
  if (type === "success") icon = "✅";
  if (type === "error") icon = "❌";
  if (type === "warning") icon = "⚠️";

  elements.toast.innerHTML = `<span class="toast-icon">${icon}</span><span class="toast-message">${escapeHtml(message)}</span>`;
  elements.toast.className = `toast toast-${type}`;
  elements.toast.classList.remove("hidden");

  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    elements.toast.classList.add("hidden");
  }, 3600);
}


/**
 * Render lại công thức toán học sau khi JavaScript thay đổi nội dung DOM.
 *
 * Lý do cần hàm này:
 * - Câu hỏi, đáp án, giải thích được tạo động bằng JS.
 * - MathJax chỉ tự quét nội dung có sẵn khi trang tải.
 * - Vì vậy sau mỗi lần render câu hỏi/xem đáp án/xem lại bài cần gọi typesetPromise().
 */
function renderMath(root = document.body, retry = 0) {
  if (!root) return;

  if (window.MathJax && typeof window.MathJax.typesetPromise === "function") {
    try {
      if (typeof window.MathJax.typesetClear === "function") {
        window.MathJax.typesetClear([root]);
      }

      window.MathJax.typesetPromise([root]).catch((error) => {
        console.warn("MathJax render error:", error);
      });
    } catch (error) {
      console.warn("MathJax render error:", error);
    }

    return;
  }

  // MathJax được load bằng async CDN, nên đôi khi JS render câu hỏi trước khi MathJax sẵn sàng.
  if (retry < 30) {
    setTimeout(() => renderMath(root, retry + 1), 120);
  }
}

function queueMathRender(root = document.body) {
  requestAnimationFrame(() => renderMath(root));
}


function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => {
    return String(a).localeCompare(String(b), "vi", { numeric: true });
  });
}

function setSelectOptions(selectElement, values, placeholder) {
  selectElement.innerHTML = "";

  const placeholderOption = document.createElement("option");
  placeholderOption.value = "";
  placeholderOption.textContent = placeholder;
  selectElement.append(placeholderOption);

  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    selectElement.append(option);
  });
}

function normalizeLibrary(rawData) {
  const items = Array.isArray(rawData) ? rawData : rawData.quizzes;

  if (!Array.isArray(items)) {
    throw new Error("quiz-list.json phải là một mảng hoặc object có trường quizzes.");
  }

  return items.map((item, index) => {
    const requiredFields = ["major", "semester", "subject", "lessonName", "path"];

    requiredFields.forEach((field) => {
      if (!item[field]) {
        throw new Error(`Mục số ${index + 1} trong quiz-list.json thiếu trường ${field}.`);
      }
    });

    return {
      id: item.id || `quiz-${index + 1}`,
      major: item.major,
      semester: item.semester,
      subject: item.subject,
      title: item.title || item.subject,
      lessonName: item.lessonName,
      description: item.description || "",
      path: item.path,
      questionCount: item.questionCount || null
    };
  });
}


function resetQuizWorkspace() {
  state.activeQuizPath = "";
  state.quiz = null;
  state.questions = [];
  state.currentIndex = 0;
  state.selectedAnswers = [];
  state.checkedQuestions = [];
  state.startedAt = null;
  state.currentResultSaved = false;
  state.expandedQuizPath = "";

  document.title = "PTIT Quiz Lab";

  elements.lessonName.textContent = "Chưa có bài";
  elements.quizTitle.textContent = "Chưa có đề được nạp";
  elements.quizDescription.textContent = "Hãy chọn ngành học, kì học, môn học rồi chọn một bài kiểm tra.";
  elements.heroBreadcrumb.textContent = "Quiz workspace";
  elements.heroLessonTitle.textContent = "PTIT Quiz Lab";
  elements.heroLessonDescription.textContent =
    "Hãy chọn đề theo thứ tự Ngành học → Kì học → Môn học → Bài kiểm tra.";

  elements.questionCounter.textContent = "Câu 0/0";
  elements.questionType.textContent = "Chưa có đề";
  elements.progressFill.style.width = "0%";

  elements.totalQuestions.textContent = "0";
  elements.answeredQuestions.textContent = "0";
  elements.scorePreview.textContent = "0";

  elements.quizBox.classList.add("hidden");
  elements.resultBox.classList.add("hidden");
  elements.emptyState.classList.remove("hidden");
  elements.feedbackBox.classList.add("hidden");
  elements.answersContainer.innerHTML = "";
  elements.questionNavigator.innerHTML = "";
  elements.reviewList.innerHTML = "";

  elements.submitAnswerBtn.disabled = true;
  elements.finishQuizBtn.disabled = true;
  elements.prevBtn.disabled = true;
  elements.nextBtn.disabled = true;

  renderResultHistory();
}

async function loadLibrary() {
  const response = await fetch(QUIZ_LIST_PATH, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Không thể tải ${QUIZ_LIST_PATH}`);
  }

  const data = await response.json();
  state.library = normalizeLibrary(data);

  resetQuizWorkspace();
  renderMajorOptions();

  showToast("Đã tải danh sách đề. Hãy chọn ngành học, kì học và môn học.", "success");
}

function renderMajorOptions() {
  state.selectedMajor = "";
  state.selectedSemester = "";
  state.selectedSubject = "";

  const majors = uniqueSorted(state.library.map((item) => item.major));
  setSelectOptions(elements.majorSelect, majors, "Chọn ngành học");
  elements.majorSelect.value = "";

  elements.semesterSelect.disabled = true;
  elements.subjectSelect.disabled = true;
  setSelectOptions(elements.semesterSelect, [], "Chọn kì học");
  setSelectOptions(elements.subjectSelect, [], "Chọn môn học");

  elements.quizList.innerHTML = `<p class="empty-library">Hãy chọn ngành học, kì học và môn học.</p>`;
  elements.availableCount.textContent = "0 bài";
}

function renderSemesterOptions() {
  state.selectedMajor = elements.majorSelect.value;
  state.selectedSemester = "";
  state.selectedSubject = "";

  const semesters = uniqueSorted(
    state.library
      .filter((item) => item.major === state.selectedMajor)
      .map((item) => item.semester)
  );

  setSelectOptions(elements.semesterSelect, semesters, "Chọn kì học");
  setSelectOptions(elements.subjectSelect, [], "Chọn môn học");

  elements.semesterSelect.disabled = !state.selectedMajor;
  elements.subjectSelect.disabled = true;

  elements.quizList.innerHTML = state.selectedMajor
    ? `<p class="empty-library">Hãy chọn kì học.</p>`
    : `<p class="empty-library">Hãy chọn ngành học, kì học và môn học.</p>`;

  elements.availableCount.textContent = "0 bài";
}

function renderSubjectOptions() {
  state.selectedSemester = elements.semesterSelect.value;
  state.selectedSubject = "";

  const subjects = uniqueSorted(
    state.library
      .filter((item) => item.major === state.selectedMajor && item.semester === state.selectedSemester)
      .map((item) => item.subject)
  );

  setSelectOptions(elements.subjectSelect, subjects, "Chọn môn học");
  elements.subjectSelect.disabled = !state.selectedSemester;

  elements.quizList.innerHTML = state.selectedSemester
    ? `<p class="empty-library">Hãy chọn môn học.</p>`
    : `<p class="empty-library">Hãy chọn kì học.</p>`;

  elements.availableCount.textContent = "0 bài";
}

function renderQuizList() {
  state.selectedSubject = elements.subjectSelect.value;

  const quizzes = getFilteredQuizzes();
  elements.availableCount.textContent = `${quizzes.length} bài`;
  elements.quizList.innerHTML = "";

  if (!state.selectedSubject) {
    elements.quizList.innerHTML = `<p class="empty-library">Hãy chọn môn học.</p>`;
    return;
  }

  if (!quizzes.length) {
    elements.quizList.innerHTML = `<p class="empty-library">Không có bài kiểm tra nào cho môn này.</p>`;
    return;
  }

  quizzes.forEach((quiz) => {
    const savedAttempts = getResultsForQuiz(quiz.path);
    const bestAttempt = getBestResult(savedAttempts);
    const latestAttempt = savedAttempts[0] || null;

    const item = document.createElement("article");
    item.className = "quiz-item";

    if (quiz.path === state.activeQuizPath) {
      item.classList.add("active");
    }

    if (state.expandedQuizPath === quiz.path) {
      item.classList.add("expanded");
    }

    const countText = quiz.questionCount ? ` · ${quiz.questionCount} câu` : "";
    const mainButton = document.createElement("button");
    mainButton.className = "quiz-main";
    mainButton.type = "button";
    mainButton.innerHTML = `
      <strong>${escapeHtml(quiz.lessonName)}</strong>
      <span>${escapeHtml(quiz.title)}${escapeHtml(countText)}</span>
    `;

    mainButton.addEventListener("click", () => {
      loadQuizByPath(quiz.path);
    });

    item.append(mainButton);

    if (savedAttempts.length) {
      const summary = document.createElement("div");
      summary.className = "quiz-result-summary";
      summary.innerHTML = `
        <span class="history-pill success">${savedAttempts.length} lượt đã làm</span>
        <span class="history-pill">Cao nhất ${bestAttempt.score}/${bestAttempt.total}</span>
        <small>Lần gần nhất: ${formatDateTime(latestAttempt.finishedAt)}</small>
      `;

      const actions = document.createElement("div");
      actions.className = "quiz-result-actions";

      const toggleButton = document.createElement("button");
      toggleButton.className = "text-btn";
      toggleButton.type = "button";
      toggleButton.textContent = state.expandedQuizPath === quiz.path ? "Ẩn kết quả" : "Xem kết quả";

      toggleButton.addEventListener("click", () => {
        state.expandedQuizPath = state.expandedQuizPath === quiz.path ? "" : quiz.path;
        renderQuizList();
      });

      const latestButton = document.createElement("button");
      latestButton.className = "text-btn";
      latestButton.type = "button";
      latestButton.textContent = "Xem lần gần nhất";

      latestButton.addEventListener("click", () => {
        showSavedResultDetail(latestAttempt.id);
      });

      actions.append(toggleButton, latestButton);
      item.append(summary, actions);

      if (state.expandedQuizPath === quiz.path) {
        const attemptsBox = document.createElement("div");
        attemptsBox.className = "quiz-attempts";

        savedAttempts.slice(0, 6).forEach((attempt) => {
          const attemptButton = document.createElement("button");
          attemptButton.type = "button";
          attemptButton.className = "quiz-attempt";
          attemptButton.innerHTML = `
            <span>${formatDateTime(attempt.finishedAt)}</span>
            <strong>${attempt.score}/${attempt.total} đúng · ${attempt.percent}%</strong>
          `;

          attemptButton.addEventListener("click", () => {
            showSavedResultDetail(attempt.id);
          });

          attemptsBox.append(attemptButton);
        });

        if (savedAttempts.length > 6) {
          const more = document.createElement("p");
          more.className = "quiz-attempt-more";
          more.textContent = `Còn ${savedAttempts.length - 6} lượt khác trong lịch sử tổng.`;
          attemptsBox.append(more);
        }

        item.append(attemptsBox);
      }
    } else {
      const empty = document.createElement("div");
      empty.className = "quiz-result-summary muted";
      empty.innerHTML = `<span class="history-pill">Chưa làm</span>`;
      item.append(empty);
    }

    elements.quizList.append(item);
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getResultsForQuiz(quizPath) {
  return getSavedResults()
    .filter((result) => result.quizPath === quizPath)
    .sort((a, b) => new Date(b.finishedAt) - new Date(a.finishedAt));
}

function getBestResult(results) {
  return results.reduce((best, current) => {
    if (!best) return current;
    if (current.percent > best.percent) return current;
    if (current.percent === best.percent && current.score > best.score) return current;
    return best;
  }, null);
}

function findSavedResultById(resultId) {
  return getSavedResults().find((result) => result.id === resultId) || null;
}

function showSavedResultDetail(resultId) {
  const result = findSavedResultById(resultId);

  if (!result) {
    showToast("Không tìm thấy kết quả đã lưu.", "warning");
    return;
  }

  elements.quizBox.classList.add("hidden");
  elements.emptyState.classList.add("hidden");
  elements.resultBox.classList.remove("hidden");

  // Cập nhật vòng điểm tròn và chữ số
  if (elements.resultScoreCircle) {
    elements.resultScoreCircle.style.setProperty("--score-percent", result.percent);
  }
  if (elements.resultPercent) {
    elements.resultPercent.textContent = `${result.percent}%`;
  }
  if (elements.resultFraction) {
    elements.resultFraction.textContent = `${result.score}/${result.total} đúng`;
  }

  let evaluation = "";
  if (result.percent === 100) evaluation = "Xuất sắc! Bạn đã đạt điểm tuyệt đối! 🏆";
  else if (result.percent >= 80) evaluation = "Rất tốt! Bạn nắm rất vững kiến thức. 🌟";
  else if (result.percent >= 50) evaluation = "Đạt! Hãy cố gắng luyện tập thêm nhé. 👍";
  else evaluation = "Chưa đạt. Hãy ôn tập kỹ lại và luyện tập thêm nhé! 💪";

  elements.resultTitle.textContent = evaluation;
  elements.resultMessage.textContent =
    `Kết quả đã lưu của bài: ${result.lessonName}. Hoàn thành lúc ${formatDateTime(result.finishedAt)}${result.durationSeconds ? ` trong ${formatDuration(result.durationSeconds)}` : ""}.`;

  elements.reviewList.innerHTML = "";

  const note = document.createElement("div");
  note.className = "result-saved-note";
  const context = [result.major, result.semester, result.subject].filter(Boolean).join(" / ");
  note.textContent = context
    ? `Kết quả này được gắn với bài kiểm tra trong thư viện: ${context}.`
    : "Kết quả này được lưu từ file JSON nạp ngoài.";
  elements.reviewList.append(note);

  result.answers.forEach((answer, index) => {
    const item = document.createElement("article");
    item.className = "review-item";

    const selected = answer.selectedAnswers?.length
      ? answer.selectedAnswers.join(", ")
      : "Chưa chọn";
    const correct = answer.correctAnswers?.length
      ? answer.correctAnswers.join(", ")
      : "Không có dữ liệu";

    item.innerHTML = `
      <h4>Câu ${index + 1}: ${escapeHtml(answer.question)}</h4>
      <p><strong>Bạn chọn:</strong> ${escapeHtml(selected)}</p>
      <p><strong>Đáp án đúng:</strong> ${escapeHtml(correct)}</p>
      <p><strong>Kết quả:</strong> ${answer.isCorrect ? "Đúng" : "Sai"}</p>
    `;

    elements.reviewList.append(item);
  });

  queueMathRender(elements.resultBox);
  showToast("Đang xem lại kết quả đã lưu của bài kiểm tra.", "info");
}


function getFilteredQuizzes() {
  return state.library.filter((item) => {
    return (
      item.major === state.selectedMajor &&
      item.semester === state.selectedSemester &&
      item.subject === state.selectedSubject
    );
  });
}

function getActiveLibraryItem() {
  return state.library.find((item) => item.path === state.activeQuizPath) || null;
}

function normalizeQuiz(rawData, fallbackMeta = {}) {
  const isArrayFormat = Array.isArray(rawData);
  const rawQuestions = isArrayFormat ? rawData : rawData.questions;

  const quizMeta = {
    title: fallbackMeta.title || (isArrayFormat ? "Đề trắc nghiệm" : (rawData.title || "Đề trắc nghiệm")),
    lessonName: fallbackMeta.lessonName || (
      isArrayFormat
        ? "Chưa đặt tên bài"
        : (
            rawData.lessonName ||
            rawData.lesson_name ||
            rawData.lesson ||
            rawData.name ||
            "Chưa đặt tên bài"
          )
    ),
    description: fallbackMeta.description || (
      isArrayFormat
        ? "Đề được nạp từ file JSON dạng mảng."
        : (rawData.description || "Đề trắc nghiệm được nạp từ file JSON.")
    ),
    major: fallbackMeta.major || (!isArrayFormat ? rawData.major : "") || "",
    semester: fallbackMeta.semester || (!isArrayFormat ? rawData.semester : "") || "",
    subject: fallbackMeta.subject || (!isArrayFormat ? rawData.subject : "") || ""
  };

  if (!Array.isArray(rawQuestions)) {
    throw new Error("File JSON phải là một mảng câu hỏi hoặc object có trường questions.");
  }

  const questions = rawQuestions.map((question, questionIndex) => {
    if (typeof question.question !== "string" || !question.question.trim()) {
      throw new Error(`Câu ${questionIndex + 1} thiếu trường question.`);
    }

    const isInputType = question.type === "input" || question.type === "short";
    if (!Array.isArray(question.answers) || (!isInputType && question.answers.length < 2) || (isInputType && question.answers.length < 1)) {
      throw new Error(`Câu ${questionIndex + 1} phải có ít nhất ${isInputType ? 1 : 2} đáp án.`);
    }

    const answers = question.answers.map((answer, answerIndex) => {
      if (typeof answer.text !== "string") {
        throw new Error(`Đáp án ${answerIndex + 1} của câu ${questionIndex + 1} thiếu text.`);
      }

      if (typeof answer.correct !== "boolean") {
        throw new Error(`Đáp án ${answerIndex + 1} của câu ${questionIndex + 1} thiếu correct true/false.`);
      }

      return {
        text: answer.text,
        correct: answer.correct,
        explanation: answer.explanation || "Chưa có giải thích cho đáp án này."
      };
    });

    const correctCount = answers.filter((answer) => answer.correct).length;

    if (correctCount === 0) {
      throw new Error(`Câu ${questionIndex + 1} phải có ít nhất một đáp án đúng.`);
    }

    return {
      id: question.id ?? questionIndex + 1,
      question: question.question,
      type: question.type || (correctCount > 1 ? "multiple" : "single"),
      answers
    };
  });

  return {
    ...quizMeta,
    questions
  };
}

async function loadQuizByPath(path) {
  const item = state.library.find((quiz) => quiz.path === path);
  const response = await fetch(path, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Không thể tải file JSON: ${path}`);
  }

  const data = await response.json();
  state.activeQuizPath = path;

  loadQuiz(data, item || {});
  renderQuizList();
  showToast(`Đã nạp bài: ${state.quiz.lessonName}`, "success");
}

function loadQuiz(rawData, fallbackMeta = {}) {
  const normalized = normalizeQuiz(rawData, fallbackMeta);

  state.quiz = normalized;
  state.questions = normalized.questions;
  state.currentIndex = 0;
  state.selectedAnswers = state.questions.map(() => new Set());
  state.checkedQuestions = state.questions.map(() => false);
  state.startedAt = Date.now();
  state.currentResultSaved = false;

  document.title = `${normalized.lessonName} | PTIT Quiz Lab`;

  elements.lessonName.textContent = normalized.lessonName;
  elements.quizTitle.textContent = normalized.title;
  elements.quizDescription.textContent = normalized.description;
  elements.heroLessonTitle.textContent = normalized.lessonName;
  elements.heroLessonDescription.textContent = normalized.description;
  elements.heroBreadcrumb.textContent = buildBreadcrumb(normalized);

  elements.emptyState.classList.add("hidden");
  elements.resultBox.classList.add("hidden");
  elements.quizBox.classList.remove("hidden");

  renderQuestion();
  renderNavigator();
  updateStats();
  queueMathRender(document.body);
}

function buildBreadcrumb(quiz) {
  const parts = [quiz.major, quiz.semester, quiz.subject].filter(Boolean);
  return parts.length ? parts.join(" / ") : "Quiz workspace";
}

function renderQuestion() {
  const question = state.questions[state.currentIndex];

  if (!question) {
    elements.quizBox.classList.add("hidden");
    elements.emptyState.classList.remove("hidden");
    return;
  }

  const isMultiple = question.type === "multiple";
  const isInput = question.type === "input" || question.type === "short";
  const isChecked = state.checkedQuestions[state.currentIndex];

  elements.questionBadge.textContent = `Câu ${state.currentIndex + 1}`;
  elements.questionText.textContent = question.question;

  if (isInput) {
    elements.selectionHint.textContent = "Điền đáp án chính xác vào ô dưới đây";
    elements.questionType.textContent = "Điền đáp án ngắn";
  } else {
    elements.selectionHint.textContent = isMultiple
      ? "Có thể chọn nhiều đáp án"
      : "Chọn một đáp án đúng";
    elements.questionType.textContent = isMultiple ? "Nhiều đáp án đúng" : "Một đáp án đúng";
  }

  elements.questionCounter.textContent = `Câu ${state.currentIndex + 1}/${state.questions.length}`;

  elements.answersContainer.innerHTML = "";

  if (isInput) {
    const userAnswer = [...state.selectedAnswers[state.currentIndex]][0] || "";

    const inputWrapper = document.createElement("div");
    inputWrapper.className = "input-answer-wrapper";

    const inputField = document.createElement("input");
    inputField.type = "text";
    inputField.className = "input-answer-field";
    inputField.placeholder = "Nhập đáp án của bạn tại đây...";
    inputField.value = userAnswer;
    inputField.disabled = isChecked;

    inputWrapper.append(inputField);
    elements.answersContainer.append(inputWrapper);

    // Save answer on input change
    inputField.addEventListener("input", (e) => {
      const val = e.target.value;
      state.selectedAnswers[state.currentIndex] = new Set([val]);
      elements.submitAnswerBtn.disabled = val.trim() === "";
    });

    if (isChecked) {
      const isCorrect = isQuestionCorrect(state.currentIndex);
      inputField.classList.add(isCorrect ? "correct" : "wrong");

      const correctAnswers = question.answers
        .filter((ans) => ans.correct)
        .map((ans) => ans.text);

      const correctAnsLabel = document.createElement("div");
      correctAnsLabel.className = `input-feedback-note ${isCorrect ? "correct" : "wrong"}`;
      correctAnsLabel.innerHTML = `
        <strong>Kết quả:</strong> ${isCorrect ? "Đúng! 🎉" : "Chưa chính xác! ❌"}<br>
        <strong>Đáp án đúng:</strong> ${escapeHtml(correctAnswers.join(" hoặc "))}
      `;
      inputWrapper.append(correctAnsLabel);
    }
  } else {
    question.answers.forEach((answer, answerIndex) => {
      const option = document.createElement("label");
      option.className = "answer-option";

      const input = document.createElement("input");
      input.type = isMultiple ? "checkbox" : "radio";
      input.name = `question-${state.currentIndex}`;
      input.checked = state.selectedAnswers[state.currentIndex].has(answerIndex);
      input.disabled = isChecked;

      // Custom radio/checkbox circles/squares instead of letter text
      const letter = document.createElement("span");
      letter.className = isMultiple ? "answer-checkbox" : "answer-radio";

      const content = document.createElement("span");
      content.className = "answer-content";

      const text = document.createElement("strong");
      text.textContent = answer.text;

      const explanation = document.createElement("span");
      explanation.className = "answer-explanation";
      explanation.textContent = answer.explanation;

      content.append(text, explanation);
      option.append(input, letter, content);

      if (input.checked) {
        option.classList.add("selected");
      }

      if (isChecked) {
        option.classList.add("revealed");
        const selected = state.selectedAnswers[state.currentIndex].has(answerIndex);

        if (answer.correct && selected) {
          option.classList.add("correct");
        } else if (!answer.correct && selected) {
          option.classList.add("wrong");
        } else if (answer.correct && !selected) {
          option.classList.add("missed");
        }
      }

      input.addEventListener("change", () => {
        selectAnswer(answerIndex);
      });

      elements.answersContainer.append(option);
    });
  }

  if (isChecked) {
    const isCorrect = isQuestionCorrect(state.currentIndex);
    if (isInput) {
      elements.feedbackBox.classList.add("hidden");
      elements.feedbackBox.textContent = "";
    } else {
      elements.feedbackBox.classList.remove("hidden");
      elements.feedbackBox.textContent = isCorrect
        ? "Chính xác. Các lựa chọn đúng của bạn được đánh dấu màu xanh."
        : "Chưa chính xác. Màu đỏ là đáp án bạn chọn sai, màu vàng là đáp án đúng bị bỏ lỡ.";
    }
  } else {
    elements.feedbackBox.classList.add("hidden");
    elements.feedbackBox.textContent = "";
  }

  if (isChecked) {
    elements.submitAnswerBtn.disabled = false;
    if (state.currentIndex === state.questions.length - 1) {
      elements.submitAnswerBtn.textContent = "Nộp bài & Xem kết quả 🏁";
    } else {
      elements.submitAnswerBtn.textContent = "Câu tiếp theo →";
    }
  } else {
    elements.submitAnswerBtn.textContent = "Kiểm tra câu này";
    if (isInput) {
      const userAnswer = [...state.selectedAnswers[state.currentIndex]][0] || "";
      elements.submitAnswerBtn.disabled = userAnswer.trim() === "";
    } else {
      elements.submitAnswerBtn.disabled = state.selectedAnswers[state.currentIndex].size === 0;
    }
  }

  elements.prevBtn.disabled = state.currentIndex === 0;
  elements.nextBtn.disabled = state.currentIndex === state.questions.length - 1;

  renderNavigator();
  updateStats();
  queueMathRender(elements.quizBox);
}

function selectAnswer(answerIndex) {
  const question = state.questions[state.currentIndex];
  const selectedSet = state.selectedAnswers[state.currentIndex];

  if (question.type === "single") {
    selectedSet.clear();
    selectedSet.add(answerIndex);
  } else {
    if (selectedSet.has(answerIndex)) {
      selectedSet.delete(answerIndex);
    } else {
      selectedSet.add(answerIndex);
    }
  }

  renderQuestion();
}

function checkCurrentQuestion() {
  if (!state.questions.length) return;

  state.checkedQuestions[state.currentIndex] = true;
  renderQuestion();
}

function isQuestionCorrect(questionIndex) {
  const question = state.questions[questionIndex];
  const selectedSet = state.selectedAnswers[questionIndex];

  if (question.type === "input" || question.type === "short") {
    const userAnswer = [...selectedSet][0]?.trim().toLowerCase() || "";
    return question.answers.some((answer) => {
      return answer.correct && answer.text.trim().toLowerCase() === userAnswer;
    });
  }

  return question.answers.every((answer, answerIndex) => {
    return answer.correct === selectedSet.has(answerIndex);
  });
}

function getScore() {
  return state.questions.reduce((score, _, questionIndex) => {
    return score + (isQuestionCorrect(questionIndex) ? 1 : 0);
  }, 0);
}

function updateStats() {
  const total = state.questions.length;
  const answered = state.selectedAnswers.filter((answerSet) => answerSet.size > 0).length;
  const score = state.checkedQuestions.reduce((totalScore, checked, questionIndex) => {
    return totalScore + (checked && isQuestionCorrect(questionIndex) ? 1 : 0);
  }, 0);

  elements.totalQuestions.textContent = total;
  elements.answeredQuestions.textContent = answered;
  elements.scorePreview.textContent = score;

  const progress = total === 0 ? 0 : Math.round((answered / total) * 100);
  elements.progressFill.style.width = `${progress}%`;

  elements.finishQuizBtn.disabled = total === 0;
}

function renderNavigator() {
  elements.questionNavigator.innerHTML = "";

  state.questions.forEach((_, questionIndex) => {
    const button = document.createElement("button");
    button.className = "nav-dot";
    button.textContent = questionIndex + 1;

    const answered = state.selectedAnswers[questionIndex].size > 0;
    const checked = state.checkedQuestions[questionIndex];

    if (answered) {
      button.classList.add("answered");
    }

    if (checked) {
      button.classList.remove("answered");
      button.classList.add(isQuestionCorrect(questionIndex) ? "correct" : "wrong");
    }

    if (questionIndex === state.currentIndex) {
      button.classList.add("current");
    }

    button.addEventListener("click", () => {
      state.currentIndex = questionIndex;
      renderQuestion();
    });

    elements.questionNavigator.append(button);
  });
}


function getSavedResults() {
  try {
    const raw = localStorage.getItem(RESULT_STORAGE_KEY);
    const results = raw ? JSON.parse(raw) : [];
    return Array.isArray(results) ? results : [];
  } catch {
    return [];
  }
}

function setSavedResults(results) {
  localStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(results.slice(0, MAX_SAVED_RESULTS)));
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(value));
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "Dưới 1 phút";

  const minutes = Math.floor(seconds / 60);
  const remainSeconds = seconds % 60;

  if (minutes === 0) return `${remainSeconds} giây`;
  if (remainSeconds === 0) return `${minutes} phút`;
  return `${minutes} phút ${remainSeconds} giây`;
}

function buildResultSnapshot(score, total, percent) {
  const finishedAt = new Date().toISOString();
  const durationSeconds = state.startedAt
    ? Math.max(0, Math.round((Date.now() - state.startedAt) / 1000))
    : 0;

  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    quizPath: state.activeQuizPath || "external-file",
    lessonName: state.quiz?.lessonName || "Chưa đặt tên bài",
    title: state.quiz?.title || "Đề trắc nghiệm",
    description: state.quiz?.description || "",
    major: state.quiz?.major || "",
    semester: state.quiz?.semester || "",
    subject: state.quiz?.subject || "",
    score,
    total,
    percent,
    startedAt: state.startedAt ? new Date(state.startedAt).toISOString() : null,
    finishedAt,
    durationSeconds,
    answers: state.questions.map((question, questionIndex) => {
      const selectedIndexes = [...state.selectedAnswers[questionIndex]];
      const correctIndexes = question.answers
        .map((answer, answerIndex) => answer.correct ? answerIndex : null)
        .filter((answerIndex) => answerIndex !== null);

      return {
        questionId: question.id,
        question: question.question,
        selectedIndexes,
        selectedAnswers: selectedIndexes.map((answerIndex) => question.answers[answerIndex]?.text || ""),
        correctIndexes,
        correctAnswers: correctIndexes.map((answerIndex) => question.answers[answerIndex]?.text || ""),
        choices: question.answers.map((answer) => ({
          text: answer.text,
          correct: answer.correct,
          explanation: answer.explanation
        })),
        isCorrect: isQuestionCorrect(questionIndex)
      };
    })
  };
}

function saveCurrentResult(score, total, percent) {
  if (state.currentResultSaved) {
    return null;
  }

  const result = buildResultSnapshot(score, total, percent);
  const results = getSavedResults();
  results.unshift(result);
  setSavedResults(results);
  state.currentResultSaved = true;
  renderResultHistory();
  renderQuizList();
  return result;
}

function renderResultHistory() {
  if (!elements.resultHistory || !elements.historyCount) return;

  const results = getSavedResults();
  elements.historyCount.textContent = `${results.length} lượt làm`;
  elements.resultHistory.innerHTML = "";

  if (!results.length) {
    elements.resultHistory.innerHTML = `<p class="empty-library">Chưa có kết quả nào được lưu.</p>`;
    if (elements.exportHistoryBtn) elements.exportHistoryBtn.disabled = true;
    if (elements.clearHistoryBtn) elements.clearHistoryBtn.disabled = true;
    return;
  }

  if (elements.exportHistoryBtn) elements.exportHistoryBtn.disabled = false;
  if (elements.clearHistoryBtn) elements.clearHistoryBtn.disabled = false;

  results.slice(0, 12).forEach((result) => {
    const item = document.createElement("article");
    item.className = "history-item";

    const context = [result.major, result.semester, result.subject].filter(Boolean).join(" / ");
    const durationText = result.durationSeconds ? ` · ${formatDuration(result.durationSeconds)}` : "";

    item.innerHTML = `
      <strong>${escapeHtml(result.lessonName)}</strong>
      <div class="history-meta">
        <span class="history-pill success">${result.score}/${result.total} đúng</span>
        <span class="history-pill">${result.percent}%</span>
      </div>
      <small>${formatDateTime(result.finishedAt)}${durationText}${context ? `<br>${escapeHtml(context)}` : ""}</small>
      <button class="text-btn history-review-btn" type="button">Xem lại</button>
    `;

    item.querySelector(".history-review-btn").addEventListener("click", () => {
      showSavedResultDetail(result.id);
    });

    elements.resultHistory.append(item);
  });
}

function clearResultHistory() {
  const results = getSavedResults();
  if (!results.length) {
    showToast("Chưa có lịch sử để xóa.", "warning");
    return;
  }

  const confirmed = window.confirm("Bạn có chắc muốn xóa toàn bộ lịch sử làm bài đã lưu trên trình duyệt này?");
  if (!confirmed) return;

  localStorage.removeItem(RESULT_STORAGE_KEY);
  state.expandedQuizPath = "";
  renderResultHistory();
  renderQuizList();
  showToast("Đã xóa lịch sử làm bài.", "success");
}

function exportResultHistory() {
  const results = getSavedResults();
  if (!results.length) {
    showToast("Chưa có kết quả để xuất.", "warning");
    return;
  }

  const payload = {
    app: "PTIT Quiz Lab",
    exportedAt: new Date().toISOString(),
    totalAttempts: results.length,
    results
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `ptit-quiz-results-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  showToast("Đã xuất lịch sử làm bài ra file JSON.", "success");
}

function finishQuiz() {
  if (!state.questions.length) return;

  state.checkedQuestions = state.questions.map(() => true);

  const total = state.questions.length;
  const score = getScore();
  const percent = Math.round((score / total) * 100);

  elements.quizBox.classList.add("hidden");
  elements.emptyState.classList.add("hidden");
  elements.resultBox.classList.remove("hidden");

  const savedResult = saveCurrentResult(score, total, percent);

  if (elements.resultScoreCircle) {
    elements.resultScoreCircle.style.setProperty("--score-percent", percent);
  }
  if (elements.resultPercent) {
    elements.resultPercent.textContent = `${percent}%`;
  }
  if (elements.resultFraction) {
    elements.resultFraction.textContent = `${score}/${total} đúng`;
  }

  let evaluation = "";
  if (percent === 100) evaluation = "Xuất sắc! Bạn đã đạt điểm tuyệt đối! 🏆";
  else if (percent >= 80) evaluation = "Rất tốt! Bạn nắm rất vững kiến thức. 🌟";
  else if (percent >= 50) evaluation = "Đạt! Hãy cố gắng luyện tập thêm nhé. 👍";
  else evaluation = "Chưa đạt. Hãy ôn tập kỹ lại và luyện tập thêm nhé! 💪";

  elements.resultTitle.textContent = evaluation;
  elements.resultMessage.textContent = `Bài học: ${state.quiz.lessonName}. Bạn làm đúng ${score}/${total} câu (${percent}%). Hãy bấm "Xem đáp án" bên dưới để ôn tập kỹ hơn các giải thích chi tiết.`;

  elements.reviewList.innerHTML = "";

  if (savedResult) {
    const note = document.createElement("div");
    note.className = "result-saved-note";
    note.textContent = `Kết quả đã được lưu trực tiếp vào thẻ bài kiểm tra trong thư viện lúc ${formatDateTime(savedResult.finishedAt)}.`;
    elements.reviewList.append(note);
  }

  renderNavigator();
  updateStats();
  queueMathRender(elements.resultBox);
}

function renderReview() {
  elements.reviewList.innerHTML = "";

  state.questions.forEach((question, questionIndex) => {
    const selectedAnswers = [...state.selectedAnswers[questionIndex]]
      .map((answerIndex) => question.answers[answerIndex].text);

    const correctAnswers = question.answers
      .filter((answer) => answer.correct)
      .map((answer) => answer.text);

    const item = document.createElement("article");
    item.className = "review-item";

    const title = document.createElement("h4");
    title.textContent = `Câu ${questionIndex + 1}: ${question.question}`;

    const userAnswer = document.createElement("p");
    userAnswer.innerHTML = `<strong>Bạn chọn:</strong> ${selectedAnswers.length ? selectedAnswers.join(", ") : "Chưa chọn"}`;

    const correctAnswer = document.createElement("p");
    correctAnswer.innerHTML = `<strong>Đáp án đúng:</strong> ${correctAnswers.join(", ")}`;

    const status = document.createElement("p");
    status.innerHTML = `<strong>Kết quả:</strong> ${isQuestionCorrect(questionIndex) ? "Đúng" : "Sai"}`;

    item.append(title, userAnswer, correctAnswer, status);
    elements.reviewList.append(item);
  });

  queueMathRender(elements.reviewList);
}

function restartQuiz() {
  state.currentIndex = 0;
  state.selectedAnswers = state.questions.map(() => new Set());
  state.checkedQuestions = state.questions.map(() => false);
  state.startedAt = Date.now();
  state.currentResultSaved = false;

  elements.resultBox.classList.add("hidden");
  elements.reviewList.innerHTML = "";
  elements.quizBox.classList.remove("hidden");

  renderQuestion();
  renderNavigator();
  updateStats();
}

function shuffleQuestions() {
  if (!state.questions.length) return;

  const packed = state.questions.map((question, index) => ({
    question,
    selected: state.selectedAnswers[index],
    checked: state.checkedQuestions[index]
  }));

  for (let i = packed.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [packed[i], packed[randomIndex]] = [packed[randomIndex], packed[i]];
  }

  state.questions = packed.map((item) => item.question);
  state.selectedAnswers = packed.map((item) => item.selected);
  state.checkedQuestions = packed.map((item) => item.checked);
  state.currentIndex = 0;

  renderQuestion();
  showToast("Đã trộn thứ tự câu hỏi.", "info");
}

function handleSubmitOrNext() {
  if (!state.questions.length) return;

  const isChecked = state.checkedQuestions[state.currentIndex];
  if (!isChecked) {
    if (state.selectedAnswers[state.currentIndex].size > 0) {
      checkCurrentQuestion();
    }
  } else {
    if (state.currentIndex < state.questions.length - 1) {
      state.currentIndex++;
      renderQuestion();
    } else {
      finishQuiz();
    }
  }
}

elements.majorSelect.addEventListener("change", () => {
  renderSemesterOptions();
});

elements.semesterSelect.addEventListener("change", () => {
  renderSubjectOptions();
});

elements.subjectSelect.addEventListener("change", () => {
  renderQuizList();
});

elements.reloadLibraryBtn.addEventListener("click", async () => {
  try {
    await loadLibrary();
  } catch (error) {
    showToast(error.message);
  }
});

elements.submitAnswerBtn.addEventListener("click", handleSubmitOrNext);

elements.finishQuizBtn.addEventListener("click", finishQuiz);

elements.prevBtn.addEventListener("click", () => {
  if (state.currentIndex > 0) {
    state.currentIndex--;
    renderQuestion();
  }
});

elements.nextBtn.addEventListener("click", () => {
  if (state.currentIndex < state.questions.length - 1) {
    state.currentIndex++;
    renderQuestion();
  }
});

elements.restartBtn.addEventListener("click", restartQuiz);

elements.showReviewBtn.addEventListener("click", renderReview);

elements.shuffleBtn.addEventListener("click", shuffleQuestions);

if (elements.clearHistoryBtn) {
  elements.clearHistoryBtn.addEventListener("click", clearResultHistory);
}

if (elements.exportHistoryBtn) {
  elements.exportHistoryBtn.addEventListener("click", exportResultHistory);
}

elements.fileInput.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const data = JSON.parse(text);
    state.activeQuizPath = "";
    loadQuiz(data);
    renderQuizList();
    showToast(`Đã nạp bài: ${state.quiz.lessonName}`, "success");
  } catch (error) {
    showToast(`Lỗi đọc JSON: ${error.message}`, "error");
  }
});

document.addEventListener("keydown", (event) => {
  if (!state.questions.length || elements.resultBox.classList.contains("hidden") === false) {
    return;
  }

  if (event.key === "ArrowLeft" && state.currentIndex > 0) {
    state.currentIndex--;
    renderQuestion();
  }

  if (event.key === "ArrowRight" && state.currentIndex < state.questions.length - 1) {
    state.currentIndex++;
    renderQuestion();
  }

  if (event.key === "Enter" && !elements.submitAnswerBtn.disabled) {
    event.preventDefault();
    handleSubmitOrNext();
  }
});

const THEME_STORAGE_KEY = "ptit_quiz_lab_theme_v1";

function initTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || "dark";
  document.documentElement.setAttribute("data-theme", savedTheme);

  if (elements.themeToggleBtn) {
    elements.themeToggleBtn.addEventListener("click", () => {
      const currentTheme = document.documentElement.getAttribute("data-theme") || "dark";
      const nextTheme = currentTheme === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", nextTheme);
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      showToast(`Đã chuyển giao diện sang chế độ ${nextTheme === "dark" ? "Tối" : "Sáng"}`, "success");
    });
  }
}

initTheme();

loadLibrary().catch((error) => {
  elements.emptyState.classList.remove("hidden");
  renderResultHistory();
  showToast(error.message, "error");
});
