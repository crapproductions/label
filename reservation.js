const reservationModal = document.getElementById('reservationModal');
const reservationOpen = document.querySelector('.reservation-open');
const reservationClose = document.querySelector('.reservation-close');
const reservationForm = document.getElementById('reservationForm');
const reservationMessage = document.getElementById('reservationMessage');
const reservationSubmit = document.querySelector('.reservation-submit');

function openReservationModal() {
  reservationModal.classList.add('is-open');
  reservationModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('reservation-lock');
  reservationMessage.textContent = '';
}

function closeReservationModal() {
  reservationModal.classList.remove('is-open');
  reservationModal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('reservation-lock');
}

reservationOpen.addEventListener('click', openReservationModal);
reservationClose.addEventListener('click', closeReservationModal);

reservationModal.addEventListener('click', function (event) {
  if (event.target === reservationModal) {
    closeReservationModal();
  }
});

document.addEventListener('keydown', function (event) {
  if (event.key === 'Escape' && reservationModal.classList.contains('is-open')) {
    closeReservationModal();
  }
});

if (window.location.search.indexOf('reservation=1') !== -1 || window.location.hash === '#reservation') {
  window.setTimeout(openReservationModal, 100);
}

reservationForm.addEventListener('submit', function (event) {
  const endpoint = reservationForm.getAttribute('action') || '';

  if (endpoint.slice(0, 8) !== 'https://') {
    event.preventDefault();
    reservationMessage.textContent = 'GOOGLE APPS SCRIPT URL REQUIRED.';
    return;
  }

  reservationSubmit.disabled = true;
  reservationSubmit.textContent = 'SENDING';
  reservationMessage.textContent = 'SENT. THANK YOU.';

  window.setTimeout(function () {
    reservationForm.reset();
    reservationSubmit.disabled = false;
    reservationSubmit.textContent = 'SEND';
  }, 1200);
});
