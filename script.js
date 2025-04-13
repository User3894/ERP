// --- تحديد العناصر الأساسية في DOM ---
const balanceEl = document.getElementById('balance');
const totalIncomeEl = document.getElementById('total-income');
const totalExpenseEl = document.getElementById('total-expense');
const transactionListEl = document.getElementById('transaction-list');
const form = document.getElementById('transaction-form');
const descriptionInput = document.getElementById('description');
const amountInput = document.getElementById('amount');
const typeInput = document.getElementById('type');
const dateInput = document.getElementById('date');
const threeContainer = document.getElementById('threejs-container');

// --- التعامل مع التخزين المحلي (LocalStorage) ---
const localStorageTransactions = JSON.parse(localStorage.getItem('transactions'));
let transactions = localStorage.getItem('transactions') !== null ? localStorageTransactions : [];

// --- دالة لإضافة معاملة ---
function addTransaction(e) {
    e.preventDefault(); // منع السلوك الافتراضي للنموذج (إعادة تحميل الصفحة)

    // التحقق من المدخلات
    if (descriptionInput.value.trim() === '' || amountInput.value.trim() === '') {
        alert('الرجاء إدخال الوصف والمبلغ');
        return;
    }
    if (isNaN(parseFloat(amountInput.value))) {
         alert('الرجاء إدخال مبلغ صحيح');
        return;
    }

    // إنشاء كائن المعاملة
    const transaction = {
        id: generateID(),
        description: descriptionInput.value,
        amount: parseFloat(amountInput.value), // تحويل المبلغ إلى رقم عشري
        type: typeInput.value,
        date: dateInput.value || new Date().toISOString().slice(0, 10) // استخدام تاريخ اليوم اذا كان فارغاً
    };

    // إضافة المعاملة الجديدة إلى المصفوفة
    transactions.push(transaction);

    // تحديث الواجهة الرسومية
    updateDOM(transaction);

    // تحديث قيم الملخص
    updateSummary();

    // حفظ التغييرات في LocalStorage
    updateLocalStorage();

    // إعادة تعيين حقول النموذج
    descriptionInput.value = '';
    amountInput.value = '';
    typeInput.value = 'income'; // إعادة للنوع الافتراضي
    dateInput.value = ''; // مسح التاريخ
}

// --- دالة لتوليد ID فريد ---
function generateID() {
    return Math.floor(Math.random() * 1000000000);
}

// --- دالة لإضافة معاملة إلى DOM (الجدول) ---
function updateDOM(transaction) {
    // تحديد علامة المبلغ (+ للإيراد، - للمصروف)
    const sign = transaction.type === 'income' ? '+' : '-';
    const amountClass = transaction.type === 'income' ? 'income' : 'expense';

    // إنشاء صف جديد في الجدول
    const tableRow = document.createElement('tr');
    tableRow.classList.add('transaction-item', amountClass); // إضافة كلاس للنوع
    tableRow.setAttribute('data-id', transaction.id); // إضافة معرف لتسهيل الحذف

    // تعبئة خلايا الصف بالبيانات
    tableRow.innerHTML = `
        <td>${transaction.description}</td>
        <td>${sign}${formatCurrency(Math.abs(transaction.amount))}</td>
        <td>${transaction.type === 'income' ? 'إيراد' : 'مصروف'}</td>
        <td>${transaction.date}</td>
        <td><button class="delete-btn" onclick="removeTransaction(${transaction.id})">حذف</button></td>
    `;

    // إضافة الصف إلى بداية الجدول (أحدث المعاملات أولاً)
    transactionListEl.prepend(tableRow);
}

// --- دالة لتحديث قيم الملخص (الإيرادات، المصروفات، الرصيد) ---
function updateSummary() {
    // حساب المبالغ الإجمالية
    const amounts = transactions.map(transaction => transaction.amount);

    const totalIncome = amounts
        .filter(item => item > 0)
        .reduce((acc, item) => (acc += item), 0);

    const totalExpense = amounts
        .filter(item => item < 0) // افتراض أن المصروفات قد تُدخل كرقم سالب او نضبطها
        .reduce((acc, item) => (acc += item), 0);

    // تعديل لحساب المصروفات بناءً على النوع
    const incomeByType = transactions
        .filter(t => t.type === 'income')
        .reduce((acc, t) => acc + t.amount, 0);

    const expenseByType = transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => acc + t.amount, 0);


    const balance = incomeByType - expenseByType;

    // تحديث عناصر DOM لعرض القيم
    totalIncomeEl.innerText = `${formatCurrency(incomeByType)} د.ع`;
    totalExpenseEl.innerText = `${formatCurrency(expenseByType)} د.ع`;
    balanceEl.innerText = `${formatCurrency(balance)} د.ع`;

    // تغيير لون الرصيد بناءً على القيمة
    balanceEl.parentElement.classList.remove('income-card', 'expense-card'); // إزالة الكلاسات السابقة
    if (balance >= 0) {
         balanceEl.parentElement.classList.add('income-card'); // أو استخدام كلاس مخصص للرصيد الإيجابي
         balanceEl.style.color = 'var(--secondary-color)';
    } else {
         balanceEl.parentElement.classList.add('expense-card'); // أو استخدام كلاس مخصص للرصيد السلبي
         balanceEl.style.color = 'var(--tertiary-color)';
    }
}


// --- دالة لتنسيق العملة ---
function formatCurrency(number) {
    // تنسيق بسيط لعددين عشريين
    return number.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

// --- دالة لحذف معاملة ---
function removeTransaction(id) {
    if (confirm('هل أنت متأكد من حذف هذه المعاملة؟')) {
        // إزالة المعاملة من المصفوفة بناءً على ID
        transactions = transactions.filter(transaction => transaction.id !== id);

        // تحديث LocalStorage
        updateLocalStorage();

        // إعادة تهيئة الواجهة (إعادة تحميل كل شيء)
        init();
    }
}

// --- دالة لتحديث LocalStorage ---
function updateLocalStorage() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// --- دالة تهيئة التطبيق ---
function init() {
    transactionListEl.innerHTML = ''; // مسح القائمة الحالية
    transactions.forEach(updateDOM); // إضافة كل المعاملات المخزنة إلى DOM
    updateSummary(); // تحديث الملخص
}

// --- إعداد Three.js للخلفية ---
let scene, camera, renderer, shape;

function initThreeJS() {
    // 1. المشهد (Scene)
    scene = new THREE.Scene();

    // 2. الكاميرا (Camera)
    camera = new THREE.PerspectiveCamera(75, threeContainer.clientWidth / threeContainer.clientHeight, 0.1, 1000);
    camera.position.z = 5; // تعديل موقع الكاميرا

    // 3. العارض (Renderer)
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true }); // alpha: true للخلفية الشفافة
    renderer.setSize(threeContainer.clientWidth, threeContainer.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio); // لدقة أفضل على الشاشات عالية الدقة
    threeContainer.appendChild(renderer.domElement);

    // 4. الشكل الهندسي (Geometry) والمادة (Material)
    // const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5); // صندوق
     const geometry = new THREE.IcosahedronGeometry(1.5, 0); // شكل عشروني الوجوه (أكثر تعقيدًا بصريًا)
    const material = new THREE.MeshBasicMaterial({
        color: 0x3498db, // لون أزرق أساسي
        wireframe: true // عرض الخطوط فقط لمظهر خفيف
    });

    // 5. الشبكة (Mesh) - دمج الشكل والمادة
    shape = new THREE.Mesh(geometry, material);
    scene.add(shape);

    // ضبط موضع الشكل قليلاً (اختياري)
     shape.position.x = 1;
     shape.position.y = -0.5;


    // 6. بدء حلقة الرسوم المتحركة
    animateThreeJS();
}

// --- حلقة الرسوم المتحركة لـ Three.js ---
function animateThreeJS() {
    requestAnimationFrame(animateThreeJS); // طلب الإطار التالي

    // تحريك الشكل (دوران بسيط)
    shape.rotation.x += 0.003;
    shape.rotation.y += 0.003;

    // عرض المشهد
    renderer.render(scene, camera);
}

// --- التعامل مع تغيير حجم النافذة ---
function onWindowResize() {
    if (camera && renderer) {
        camera.aspect = threeContainer.clientWidth / threeContainer.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(threeContainer.clientWidth, threeContainer.clientHeight);
    }
}

// --- ربط الأحداث ---
form.addEventListener('submit', addTransaction);
window.addEventListener('resize', onWindowResize); // الاستماع لتغيير حجم النافذة

// --- بدء تشغيل التطبيق ---
init(); // تهيئة عرض المعاملات والملخص
initThreeJS(); // تهيئة خلفية Three.js
