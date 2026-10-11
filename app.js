/* ARSAM Exam Lab — intentionally insecure training app. Never connect to real data. */
(function () {
  'use strict';
  const DEMO_USERNAME = 'ARSAM';
  const DEMO_PASSWORD = 'ARSAM92$#';
  const SESSION_KEY = 'arsamExamLab.session';
  const EXAMS_KEY = 'arsamExamLab.exams';
  const RESULTS_KEY = 'arsamExamLab.results';
  const OPTION_LABELS = ['الف', 'ب', 'ج', 'د'];
  const defaultExams = [{
    id: 'web-security-starter',
    title: 'آشنایی با امنیت وب',
    description: '۵ سؤال کوتاه برای سنجش مفاهیم پایهٔ وب و امنیت اطلاعات.',
    category: 'امنیت وب',
    duration: 8,
    createdAt: '2026-10-11T08:00:00.000Z',
    questions: [
      { text: 'کدام گزینه ارتباط رمزگذاری‌شدهٔ مرورگر با سایت را نشان می‌دهد؟', options: ['HTTP', 'HTTPS', 'FTP', 'فقط HTML'], answerIndex: 1, explanation: 'HTTPS با استفاده از TLS از ارتباط محافظت می‌کند.' },
      { text: 'چرا نگهداری رمز واقعی در کد جاوااسکریپت صفحه خطرناک است؟', options: ['چون جاوااسکریپت اجرا نمی‌شود', 'چون مرورگر فقط CSS می‌خواند', 'چون کد سمت کاربر قابل مشاهده است', 'چون همهٔ رمزها باید عددی باشند'], answerIndex: 2, explanation: 'هر چیزی که به مرورگر فرستاده شود باید برای کاربر قابل مشاهده فرض شود.' },
      { text: 'برای محافظت از پنل مدیریت، کدام رویکرد درست‌تر است؟', options: ['فقط مخفی کردن دکمهٔ مدیریت', 'بررسی نقش و مجوز در سرور برای هر درخواست', 'تغییر رنگ دکمه', 'قرار دادن مسیر در CSS'], answerIndex: 1, explanation: 'مخفی کردن رابط کاربری جایگزین کنترل دسترسی سمت سرور نیست.' },
      { text: 'ویژگی controlsList="nodownload" در ویدیو چه چیزی را تضمین نمی‌کند؟', options: ['پخش شدن ویدیو', 'محرمانه ماندن فایل ویدیو', 'نمایش کنترل‌های مرورگر', 'سازگاری با همهٔ فرمت‌ها'], answerIndex: 1, explanation: 'مخفی کردن دکمهٔ دانلود، دسترسی به فایل عمومی را متوقف نمی‌کند.' },
      { text: 'عمومی بودن یک PDF در CDN به‌تنهایی چه چیزی را ثابت می‌کند؟', options: ['حتماً هک شده است', 'حتماً اطلاعات دانش‌آموزان در آن است', 'فایل از آن مسیر قابل دریافت است؛ نه بیشتر', 'دیتابیس سایت عمومی است'], answerIndex: 2, explanation: 'باید محرمانگی مورد انتظار و مجوز انتشار همان فایل را بررسی کرد.' }
    ]
  }];
  function readJSON(key, fallback) {
    try { const value = JSON.parse(localStorage.getItem(key)); return value === null ? fallback : value; }
    catch (_) { return fallback; }
  }
  let exams = readJSON(EXAMS_KEY, null);
  if (!Array.isArray(exams) || exams.length === 0) {
    exams = defaultExams.slice();
    localStorage.setItem(EXAMS_KEY, JSON.stringify(exams));
  }
  let results = readJSON(RESULTS_KEY, []);
  if (!Array.isArray(results)) results = [];
  let currentUser = null;
  let activeExam = null;
  let examStarted = false;
  let selectedAnswers = {};
  let latestResult = null;
  /* INTENTIONAL LAB FLAW: answer keys are shipped to and exposed in the browser. */
  window.__EXAM_CONTENT__ = exams;
  const $ = (selector, root) => (root || document).querySelector(selector);
  const $$ = (selector, root) => Array.from((root || document).querySelectorAll(selector));
  const loginView = $('#loginView');
  const appView = $('#appView');
  const menuDropdown = $('#menuDropdown');
  const pageNames = { dashboard: 'نمای کلی', exams: 'آزمون‌ها', exam: 'اجرای آزمون', result: 'نتیجهٔ آزمون', progress: 'پیشرفت من', admin: 'پنل مدیریت' };
  function escapeHTML(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char];
    });
  }
  function makeId() { return 'exam-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8); }
  function saveExams() {
    localStorage.setItem(EXAMS_KEY, JSON.stringify(exams));
    /* INTENTIONAL LAB FLAW: answer keys remain readable after every update. */
    window.__EXAM_CONTENT__ = exams;
  }
  function saveResults() { localStorage.setItem(RESULTS_KEY, JSON.stringify(results)); }
  function getSession() { return readJSON(SESSION_KEY, null); }
  function isAdmin() { return !!(currentUser && currentUser.role === 'admin'); }
  function showToast(message, isError) {
    const toast = $('#toast');
    toast.textContent = message;
    toast.classList.toggle('error', !!isError);
    toast.hidden = false;
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(function () { toast.hidden = true; }, 3400);
  }
  function startApp(user) {
    currentUser = user;
    loginView.hidden = true;
    appView.hidden = false;
    $('#menuDropdown').hidden = true;
    $('#menuButton').setAttribute('aria-expanded', 'false');
    const adminLink = $('.admin-hidden-link');
    if (isAdmin()) adminLink.style.display = 'flex';
    else adminLink.style.display = 'none';
    updateCounters();
    renderDashboard();
    renderExamList();
    renderProgress();
    renderAdmin();
    setPage(isAdmin() && new URLSearchParams(location.search).get('mode') === 'admin' ? 'admin' : 'dashboard');
  }
  function logout() {
    localStorage.removeItem(SESSION_KEY);
    currentUser = null;
    history.replaceState(null, '', location.pathname);
    appView.hidden = true;
    loginView.hidden = false;
    $('#loginForm').reset();
    $('#loginError').hidden = true;
    menuDropdown.hidden = true;
  }
  function setPage(page) {
    const allowed = ['dashboard', 'exams', 'exam', 'result', 'progress', 'admin'];
    if (!allowed.includes(page)) page = 'dashboard';
    if (page === 'admin' && !isAdmin()) { showToast('این بخش فقط در حالت مدیریت آزمایشگاهی باز می‌شود.', true); return; }
    $$('.page-view').forEach(function (element) { element.hidden = true; });
    const target = $('#' + page + 'Page');
    if (target) target.hidden = false;
    $('#pageCrumb').textContent = pageNames[page] || pageNames.dashboard;
    $$('.side-link[data-nav]').forEach(function (item) {
      item.classList.toggle('active', item.dataset.nav === page || (page === 'exam' && item.dataset.nav === 'exams') || (page === 'result' && item.dataset.nav === 'exams'));
    });
    menuDropdown.hidden = true;
    $('#menuButton').setAttribute('aria-expanded', 'false');
    if (page === 'dashboard') renderDashboard();
    if (page === 'exams') renderExamList();
    if (page === 'progress') renderProgress();
    if (page === 'admin') renderAdmin();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function updateCounters() {
    $('#examCount').textContent = String(exams.length);
    $('#statTotal').textContent = String(exams.length);
    $('#statCompleted').textContent = String(results.length);
    $('#heroDone').textContent = results.length + ' آزمون';
    const avg = results.length ? Math.round(results.reduce((sum, item) => sum + Number(item.score || 0), 0) / results.length) : null;
    $('#statAverage').textContent = avg === null ? '—' : avg + '٪';
    $('#completedLine').style.width = Math.min(100, results.length * 16 + 4) + '%';
    $('#averageLine').style.width = (avg === null ? 4 : avg) + '%';
    $('#examResultCount').textContent = exams.length + ' آزمون';
    $('#adminExamCount').textContent = String(exams.length);
  }
  function examCardMarkup(exam, featured) {
    const done = results.some(function (result) { return result.examId === exam.id; });
    const questions = Array.isArray(exam.questions) ? exam.questions.length : 0;
    if (featured) {
      return '<article class="feature-card"><div class="exam-icon">⌘</div><div class="feature-copy"><h3>' + escapeHTML(exam.title) + '</h3><p>' + escapeHTML(exam.description || 'یک آزمون تمرینی برای یادگیری و مرور.') + '</p><div class="feature-meta"><span>◷ ' + escapeHTML(exam.duration || 8) + ' دقیقه</span><span>▤ ' + questions + ' سؤال</span><span>◎ ' + (done ? 'قبلاً انجام شده' : 'آمادهٔ شروع') + '</span></div></div><div class="feature-actions"><button class="btn btn-primary" data-start-exam="' + escapeHTML(exam.id) + '">' + (done ? 'تکرار آزمون' : 'شروع آزمون') + ' ←</button><span class="arrow-circle">↗</span></div></article>';
    }
    return '<article class="exam-card"><div class="exam-card-top"><div class="exam-icon">⌘</div><span class="exam-label">' + (done ? 'تکمیل‌شده' : 'در دسترس') + '</span></div><h3>' + escapeHTML(exam.title) + '</h3><p>' + escapeHTML(exam.description || 'یک آزمون تمرینی برای یادگیری و مرور.') + '</p><div class="exam-meta"><span>◷ ' + escapeHTML(exam.duration || 8) + ' دقیقه</span><span>▤ ' + questions + ' سؤال</span><span>◎ ' + (done ? 'انجام شده' : 'تمرینی') + '</span></div><button class="btn btn-primary" data-start-exam="' + escapeHTML(exam.id) + '">' + (done ? 'تکرار آزمون' : 'شروع آزمون') + ' <span>←</span></button></article>';
  }
  function renderDashboard() {
    updateCounters();
    $('#featuredExam').innerHTML = exams.length ? examCardMarkup(exams[0], true) : '<div class="empty-state"><h3>آزمونی موجود نیست</h3><p>از پنل مدیریت یک آزمون بساز.</p></div>';
  }
  function renderExamList() {
    $('#examList').innerHTML = exams.map(function (exam) { return examCardMarkup(exam, false); }).join('');
    $('#emptyExams').hidden = exams.length !== 0;
    $('#examList').hidden = exams.length === 0;
    updateCounters();
  }
  function openExam(id) {
    activeExam = exams.find(function (exam) { return exam.id === id; });
    if (!activeExam) { showToast('این آزمون در فهرست فعلی پیدا نشد.', true); return; }
    examStarted = false;
    selectedAnswers = {};
    renderExamRun();
    setPage('exam');
  }
  function renderExamRun() {
    if (!activeExam) return;
    const container = $('#examRunContainer');
    if (!examStarted) {
      container.innerHTML = '<div class="run-card"><div class="run-heading"><div><p class="eyebrow">READY WHEN YOU ARE</p><h1>' + escapeHTML(activeExam.title) + '</h1><p class="muted">' + escapeHTML(activeExam.description || 'آماده‌ای دانشت رو بسنجی؟') + '</p></div><span class="run-badge">آزمون تمرینی</span></div><div class="exam-paper"><div class="exam-paper-head"><strong>قبل از شروع</strong><span>اطلاعات آزمون</span></div><div class="result-details"><div class="result-detail"><span>تعداد سؤال</span><strong>' + activeExam.questions.length + '</strong></div><div class="result-detail"><span>زمان پیشنهادی</span><strong>' + escapeHTML(activeExam.duration || 8) + ' دقیقه</strong></div><div class="result-detail"><span>امتیاز کل</span><strong>۱۰۰</strong></div></div><div class="run-warning">این آزمون فقط برای تمرین است. پس از شروع، به سؤال‌ها پاسخ بده و در پایان نتیجه و توضیحات هر پاسخ را ببین.</div><button class="btn btn-primary btn-wide" data-action="start">شروع آزمون <span>←</span></button></div></div>';
      return;
    }
    const questions = activeExam.questions.map(function (question, qIndex) {
      const options = (question.options || []).map(function (option, optionIndex) {
        const selected = selectedAnswers[qIndex] === optionIndex;
        return '<button type="button" class="answer-option' + (selected ? ' selected' : '') + '" data-answer-question="' + qIndex + '" data-answer-choice="' + optionIndex + '" aria-pressed="' + selected + '"><span class="option-letter">' + OPTION_LABELS[optionIndex] + '</span><span>' + escapeHTML(option) + '</span></button>';
      }).join('');
      return '<div class="question-block"><div class="question-title"><span class="question-number">' + (qIndex + 1) + '</span><span>' + escapeHTML(question.text) + '</span></div><div class="answer-options">' + options + '</div></div>';
    }).join('');
    container.innerHTML = '<div class="run-card"><div class="run-heading"><div><p class="eyebrow">ASSESSMENT IN PROGRESS</p><h1>' + escapeHTML(activeExam.title) + '</h1><p class="muted">با دقت پاسخ بده؛ می‌تونی قبل از ثبت نهایی پاسخ‌ها رو تغییر بدی.</p></div><span class="run-badge">' + activeExam.questions.length + ' سؤال</span></div><div class="exam-paper"><div class="exam-paper-head"><strong>برگهٔ پاسخ</strong><span id="answeredCount">' + Object.keys(selectedAnswers).length + ' از ' + activeExam.questions.length + ' پاسخ</span></div>' + questions + '<div class="run-footer"><span>پس از ثبت، نمرهٔ تمرینی نمایش داده می‌شود.</span><button class="btn btn-primary" data-action="submit-exam">ثبت پاسخ‌ها و دیدن نتیجه <span>←</span></button></div></div></div>';
  }
  function submitExam() {
    if (!activeExam || !examStarted) return;
    const unanswered = activeExam.questions.filter(function (_, index) { return !Object.prototype.hasOwnProperty.call(selectedAnswers, index); }).length;
    if (unanswered && !window.confirm('به ' + unanswered + ' سؤال پاسخ ندادی. نتیجه را همین حالا ثبت کنیم؟')) return;
    let correct = 0;
    activeExam.questions.forEach(function (question, index) { if (Number(selectedAnswers[index]) === Number(question.answerIndex)) correct += 1; });
    const score = activeExam.questions.length ? Math.round((correct / activeExam.questions.length) * 100) : 0;
    latestResult = { resultId: makeId(), examId: activeExam.id, title: activeExam.title, score: score, correct: correct, total: activeExam.questions.length, answers: Object.assign({}, selectedAnswers), date: new Date().toISOString() };
    results.unshift(latestResult);
    saveResults();
    renderResult(latestResult);
    updateCounters();
    setPage('result');
  }
  function renderResult(result) {
    const exam = exams.find(function (item) { return item.id === result.examId; }) || activeExam;
    if (!exam) return;
    const headline = result.score >= 80 ? 'عالی پیش رفتی!' : result.score >= 50 ? 'مسیرت رو ادامه بده.' : 'یک بار دیگه تمرین کن.';
    const review = exam.questions.map(function (question, index) {
      const chosen = Object.prototype.hasOwnProperty.call(result.answers || {}, index) ? Number(result.answers[index]) : null;
      const right = Number(question.answerIndex);
      const isCorrect = chosen === right;
      const yourText = chosen === null ? 'بدون پاسخ' : (question.options || [])[chosen];
      return '<article class="review-item"><h3>' + (index + 1) + '. ' + escapeHTML(question.text) + '</h3><div class="review-answer ' + (isCorrect ? 'good' : 'bad') + '">پاسخ تو: ' + escapeHTML(yourText || 'بدون پاسخ') + '</div><div class="review-answer good">پاسخ درست: ' + escapeHTML((question.options || [])[right] || '') + '</div><div class="review-answer">' + escapeHTML(question.explanation || 'برای یادگیری بیشتر این سؤال را مرور کن.') + '</div></article>';
    }).join('');
    $('#resultContainer').innerHTML = '<div class="result-hero"><div class="score-ring"><strong>' + result.score + '</strong><span>از ۱۰۰</span></div><div class="result-copy"><p class="eyebrow">YOUR RESULT IS READY</p><h1>' + headline + '</h1><p>نتیجهٔ آزمون «' + escapeHTML(result.title) + '» ثبت شد. پاسخ‌ها و نکته‌های هر سؤال را مرور کن.</p></div></div><div class="result-details"><div class="result-detail"><span>پاسخ درست</span><strong>' + result.correct + ' از ' + result.total + '</strong></div><div class="result-detail"><span>نمره</span><strong>' + result.score + '٪</strong></div><div class="result-detail"><span>وضعیت</span><strong>' + (result.score >= 50 ? 'قبول تمرینی' : 'نیاز به مرور') + '</strong></div></div><div class="section-heading"><div><h2>مرور پاسخ‌ها</h2><p class="muted">پاسخ درست و توضیح هر سؤال</p></div><button class="text-button" data-nav="exams">آزمون بعدی ←</button></div><div class="review-list">' + review + '</div>';
    const video = $('#analysisVideo');
    if (video) video.load();
  }
  function renderProgress() {
    updateCounters();
    const average = results.length ? Math.round(results.reduce(function (sum, result) { return sum + Number(result.score || 0); }, 0) / results.length) : null;
    const best = results.length ? Math.max.apply(null, results.map(function (result) { return Number(result.score || 0); })) : null;
    $('#progressAverage').textContent = average === null ? '—' : average + '٪';
    $('#progressCount').textContent = String(results.length);
    $('#progressBest').textContent = best === null ? '—' : best + '٪';
    $('#historyList').innerHTML = results.map(function (result) {
      let date = 'زمان نامشخص';
      try { date = new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(result.date)); } catch (_) {}
      return '<article class="history-row"><div class="history-check">✓</div><div class="history-info"><strong>' + escapeHTML(result.title) + '</strong><span>' + escapeHTML(date) + ' · ' + result.correct + ' پاسخ درست از ' + result.total + '</span></div><div class="history-score"><strong>' + result.score + '٪</strong><span>نمره</span></div></article>';
    }).join('');
    $('#emptyHistory').hidden = results.length !== 0;
    $('#historyList').hidden = results.length === 0;
  }
  let builderQuestionNumber = 0;
  function addBuilderQuestion() {
    builderQuestionNumber += 1;
    const number = builderQuestionNumber;
    const wrapper = document.createElement('section');
    wrapper.className = 'builder-question';
    wrapper.dataset.builderQuestion = String(number);
    const header = document.createElement('div'); header.className = 'builder-question-head';
    const title = document.createElement('strong'); title.textContent = 'سؤال ' + number;
    const remove = document.createElement('button');
    remove.type = 'button'; remove.className = 'remove-question'; remove.textContent = 'حذف سؤال';
    remove.addEventListener('click', function () { wrapper.remove(); renumberBuilderQuestions(); });
    header.append(title, remove);
    const prompt = document.createElement('input');
    prompt.className = 'q-prompt'; prompt.required = true; prompt.maxLength = 350; prompt.placeholder = 'متن سؤال را بنویس'; prompt.setAttribute('aria-label', 'متن سؤال ' + number);
    const options = document.createElement('div'); options.className = 'option-input-grid';
    OPTION_LABELS.forEach(function (label, index) {
      const input = document.createElement('input');
      input.className = 'q-option'; input.required = true; input.maxLength = 180; input.placeholder = 'گزینهٔ ' + label; input.setAttribute('aria-label', 'گزینهٔ ' + label + ' برای سؤال ' + number); input.dataset.optionIndex = String(index);
      options.appendChild(input);
    });
    const correctRow = document.createElement('label'); correctRow.className = 'correct-row'; correctRow.textContent = 'پاسخ صحیح: ';
    const select = document.createElement('select'); select.className = 'q-correct';
    OPTION_LABELS.forEach(function (label, index) { const option = document.createElement('option'); option.value = String(index); option.textContent = label; select.appendChild(option); });
    correctRow.appendChild(select);
    wrapper.append(header, prompt, options, correctRow);
    $('#builderQuestions').appendChild(wrapper);
    renumberBuilderQuestions();
  }
  function renumberBuilderQuestions() {
    $$('.builder-question').forEach(function (block, index) {
      const heading = $('.builder-question-head strong', block);
      if (heading) heading.textContent = 'سؤال ' + (index + 1);
    });
  }
  function renderAdmin() {
    $('#adminExamList').innerHTML = exams.map(function (exam) {
      const questions = Array.isArray(exam.questions) ? exam.questions.length : 0;
      const isDefault = exam.id === 'web-security-starter';
      return '<article class="admin-exam-row"><div class="exam-icon">▤</div><div><strong>' + escapeHTML(exam.title) + '</strong><span>' + questions + ' سؤال · ' + (isDefault ? 'آزمون نمونه' : 'ساخته‌شده در این مرورگر') + '</span></div>' + (isDefault ? '<span>پیش‌فرض</span>' : '<button type="button" data-delete-exam="' + escapeHTML(exam.id) + '">حذف آزمون</button>') + '</article>';
    }).join('');
    $('#adminExamCount').textContent = String(exams.length);
    if (!$('#builderQuestions').children.length) { builderQuestionNumber = 0; addBuilderQuestion(); }
  }
  $('#loginForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const username = $('#username').value.trim();
    const password = $('#password').value;
    /* INTENTIONAL LAB FLAW: demo credentials are hard-coded in client-side code. */
    if (username === DEMO_USERNAME && password === DEMO_PASSWORD) {
      const session = { name: 'Arsam', role: 'student', createdAt: Date.now() };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      $('#loginError').hidden = true;
      startApp(session);
    } else { $('#loginError').hidden = false; }
  });
  $('#menuButton').addEventListener('click', function () {
    menuDropdown.hidden = !menuDropdown.hidden;
    this.setAttribute('aria-expanded', String(!menuDropdown.hidden));
  });
  document.addEventListener('click', function (event) {
    const nav = event.target.closest('[data-nav]');
    if (nav) { event.preventDefault(); setPage(nav.dataset.nav); return; }
    const start = event.target.closest('[data-start-exam]');
    if (start) { openExam(start.dataset.startExam); return; }
    const answer = event.target.closest('[data-answer-question]');
    if (answer) {
      selectedAnswers[Number(answer.dataset.answerQuestion)] = Number(answer.dataset.answerChoice);
      renderExamRun();
      const count = $('#answeredCount');
      if (count) count.textContent = Object.keys(selectedAnswers).length + ' از ' + activeExam.questions.length + ' پاسخ';
      return;
    }
    const action = event.target.closest('[data-action]');
    if (action) {
      if (action.dataset.action === 'start') { examStarted = true; renderExamRun(); }
      if (action.dataset.action === 'submit-exam') submitExam();
      return;
    }
    const del = event.target.closest('[data-delete-exam]');
    if (del) {
      const id = del.dataset.deleteExam;
      if (window.confirm('این آزمون از همین مرورگر حذف شود؟')) {
        exams = exams.filter(function (exam) { return exam.id !== id; });
        saveExams(); renderAdmin(); renderDashboard(); renderExamList(); updateCounters(); showToast('آزمون از حافظهٔ این مرورگر حذف شد.');
      }
      return;
    }
    if (!event.target.closest('#menuDropdown') && !event.target.closest('#menuButton')) menuDropdown.hidden = true;
  });
  $('#addQuestionBtn').addEventListener('click', addBuilderQuestion);
  $('#createExamForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const title = $('#newExamTitle').value.trim();
    const description = $('#newExamDescription').value.trim();
    const questionBlocks = $$('.builder-question');
    const error = $('#adminError');
    const questions = [];
    if (!title) { error.textContent = 'عنوان آزمون را وارد کن.'; error.hidden = false; return; }
    if (!questionBlocks.length) { error.textContent = 'حداقل یک سؤال اضافه کن.'; error.hidden = false; return; }
    for (let i = 0; i < questionBlocks.length; i += 1) {
      const block = questionBlocks[i];
      const text = $('.q-prompt', block).value.trim();
      const options = $$('.q-option', block).map(function (input) { return input.value.trim(); });
      if (!text || options.some(function (option) { return !option; })) {
        error.textContent = 'متن و چهار گزینهٔ سؤال ' + (i + 1) + ' را کامل کن.'; error.hidden = false; return;
      }
      questions.push({ text: text, options: options, answerIndex: Number($('.q-correct', block).value), explanation: 'این آزمون برای تمرین ساخته شده؛ پاسخ را با محتوای آموزشی مرور کن.' });
    }
    const exam = { id: makeId(), title: title, description: description || 'آزمون تمرینی ساخته‌شده در پنل مدیریت.', category: 'آزمون تمرینی', duration: Math.max(1, Math.round(questions.length * 2)), createdAt: new Date().toISOString(), questions: questions };
    exams.unshift(exam);
    saveExams();
    $('#createExamForm').reset();
    $('#builderQuestions').innerHTML = '';
    builderQuestionNumber = 0; addBuilderQuestion();
    error.hidden = true;
    renderAdmin(); renderExamList(); renderDashboard(); updateCounters();
    showToast('آزمون ساخته شد و در همین مرورگر در دسترس است.');
  });
  $('#logoutBtn').addEventListener('click', logout);
  $('#menuLogout').addEventListener('click', logout);
  const video = $('#analysisVideo');
  video.addEventListener('contextmenu', function (event) { event.preventDefault(); });
  /* INTENTIONAL LAB FLAW: a query parameter grants client-side admin mode without authentication. */
  const params = new URLSearchParams(window.location.search);
  if (params.get('mode') === 'admin') {
    currentUser = { name: 'Admin Guest', role: 'admin' };
    localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
    startApp(currentUser);
  } else {
    const savedSession = getSession();
    if (savedSession && savedSession.name) startApp(savedSession);
  }
})();