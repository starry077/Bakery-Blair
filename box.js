// Конструктор боксу: вибір коробки, смаків і доставки з підрахунком ціни
const ROLL_PRICE = 4.5;

const form = document.getElementById('box-form');
const rows = [...form.querySelectorAll('.flavour-picker li')];
const status = document.getElementById('box-status');
const dateInput = document.getElementById('box-date');
const address = document.getElementById('box-address');
const createBtn = document.getElementById('create-btn');

const sum = {
    box: document.getElementById('sum-box'),
    flavours: document.getElementById('sum-flavours'),
    delivery: document.getElementById('sum-delivery'),
    total: document.getElementById('sum-total'),
    hint: document.getElementById('summary-hint'),
};

const money = value => value.toFixed(2) + '€';
const checked = name => form.querySelector(`input[name="${name}"]:checked`);
const count = row => Number(row.querySelector('output').value);
const setCount = (row, value) => { row.querySelector('output').value = value; };
const totalRolls = () => rows.reduce((n, row) => n + count(row), 0);

// найближча дата — завтра
const tomorrow = new Date(Date.now() + 864e5);
dateInput.min = tomorrow.toISOString().slice(0, 10);

function capacity() {
    const box = checked('box');
    return box ? Number(box.dataset.capacity) : 0;
}

// якщо обрали меншу коробку — прибираємо зайві роли з кінця списку
function fitToBox() {
    let extra = totalRolls() - capacity();
    for (let i = rows.length - 1; i >= 0 && extra > 0; i--) {
        const take = Math.min(count(rows[i]), extra);
        setCount(rows[i], count(rows[i]) - take);
        extra -= take;
    }
}

function update() {
    const box = checked('box');
    const delivery = checked('delivery');
    const cap = capacity();
    const rolls = totalRolls();
    const left = cap - rolls;

    // кнопки + / −
    rows.forEach(row => {
        row.querySelector('.minus').disabled = count(row) === 0;
        row.querySelector('.plus').disabled = !box || left === 0;
        row.classList.toggle('picked', count(row) > 0);
    });

    // статус заповнення
    status.classList.toggle('full', box && left === 0);
    if (!box) status.textContent = 'Choose a box first';
    else if (left === 0) status.textContent = `Your ${box.value.toLowerCase()} is full ✓`;
    else status.textContent = `Add ${left} more roll${left > 1 ? 's' : ''} (${rolls} of ${cap})`;

    // адреса потрібна лише для доставки
    const homeDelivery = delivery && delivery.id === 'd-home';
    address.required = Boolean(homeDelivery);
    form.classList.toggle('with-address', Boolean(homeDelivery));

    // підсумок
    const picked = rows.filter(row => count(row) > 0)
        .map(row => `${row.dataset.flavour} × ${count(row)}`);
    const boxPrice = box ? Number(box.dataset.price) : 0;
    const deliveryPrice = delivery ? Number(delivery.dataset.price) : 0;
    const total = boxPrice + rolls * ROLL_PRICE + deliveryPrice;

    sum.box.textContent = box ? `${box.value} (${money(boxPrice)})` : '—';
    sum.flavours.textContent = picked.length ? `${picked.join(', ')} (${money(rolls * ROLL_PRICE)})` : '—';
    sum.delivery.textContent = delivery
        ? `${delivery.value}${dateInput.value ? ', ' + dateInput.value : ''} (${money(deliveryPrice)})`
        : '—';
    sum.total.textContent = money(total);

    // що ще залишилось зробити
    const todo = [];
    if (!box) todo.push('choose a box');
    else if (left > 0) todo.push(`add ${left} more roll${left > 1 ? 's' : ''}`);
    if (!delivery) todo.push('pick delivery');
    if (!dateInput.value || !dateInput.checkValidity()) todo.push('choose a date');
    if (homeDelivery && !address.checkValidity()) todo.push('write the address');

    createBtn.disabled = todo.length > 0;
    sum.hint.textContent = todo.length ? 'To finish: ' + todo.join(', ') : 'Everything is ready!';
}

// + / − для смаків
form.addEventListener('click', event => {
    const btn = event.target.closest('.plus, .minus');
    if (!btn) return;
    const row = btn.closest('li');
    const change = btn.classList.contains('plus') ? 1 : -1;
    if (change > 0 && totalRolls() >= capacity()) return;
    setCount(row, Math.max(0, count(row) + change));
    update();
});

form.addEventListener('change', event => {
    if (event.target.name === 'box') fitToBox();
    update();
});
form.addEventListener('input', update);

form.addEventListener('submit', event => {
    event.preventDefault();
    if (createBtn.disabled) return;
    document.getElementById('done-text').textContent =
        `${sum.box.textContent}: ${sum.flavours.textContent}. ${sum.delivery.textContent}. Total: ${sum.total.textContent}.`;
    location.hash = 'box-done';
});

update();
