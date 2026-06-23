const mailOrderModal = document.getElementById('mailOrderModal');
const mailOrderOpen = document.querySelector('.mail-order-open');
const mailOrderClose = document.querySelector('.mail-order-close');
const mailOrderForm = document.getElementById('mailOrderForm');
const mailOrderMessage = document.getElementById('mailOrderMessage');
const mailOrderSubmit = document.querySelector('.mail-order-submit');

const mailOrderEndpointBase = 'https://script.google.com/macros/s/';
const mailOrderEndpointId = '';
const mailOrderEndpoint = mailOrderEndpointId ? mailOrderEndpointBase + mailOrderEndpointId + '/exec' : '';

if (mailOrderForm && mailOrderEndpoint) {
  mailOrderForm.setAttribute('action', mailOrderEndpoint);
}

function openMailOrderModal() {
  if (!mailOrderModal) return;
  mailOrderModal.classList.add('is-open');
  mailOrderModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('mail-order-lock');
  if (mailOrderMessage) mailOrderMessage.textContent = '';
}

function closeMailOrderModal() {
  if (!mailOrderModal) return;
  mailOrderModal.classList.remove('is-open');
  mailOrderModal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('mail-order-lock');
}

if (mailOrderOpen) mailOrderOpen.addEventListener('click', openMailOrderModal);
if (mailOrderClose) mailOrderClose.addEventListener('click', closeMailOrderModal);

if (mailOrderModal) {
  mailOrderModal.addEventListener('click', function (event) {
    if (event.target === mailOrderModal) closeMailOrderModal();
  });
}

document.addEventListener('keydown', function (event) {
  if (event.key === 'Escape' && mailOrderModal && mailOrderModal.classList.contains('is-open')) {
    closeMailOrderModal();
  }
});

if (window.location.hash === '#order' || window.location.hash === '#mail-order') {
  window.setTimeout(openMailOrderModal, 100);
}

if (mailOrderForm) {
  mailOrderForm.addEventListener('submit', function (event) {
    const endpoint = mailOrderForm.getAttribute('action') || '';

    if (endpoint.slice(0, 8) !== 'https://') {
      event.preventDefault();
      if (mailOrderMessage) mailOrderMessage.textContent = 'GOOGLE APPS SCRIPT URL REQUIRED.';
      return;
    }

    if (mailOrderSubmit) {
      mailOrderSubmit.disabled = true;
      mailOrderSubmit.textContent = 'SENDING';
    }

    if (mailOrderMessage) mailOrderMessage.textContent = 'SENT. THANK YOU.';

    window.setTimeout(function () {
      mailOrderForm.reset();
      if (mailOrderSubmit) {
        mailOrderSubmit.disabled = false;
        mailOrderSubmit.textContent = 'SEND';
      }
    }, 1200);
  });
}
