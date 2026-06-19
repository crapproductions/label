const reservationModal = document.getElementById('reservationModal');
const reservationOpen = document.querySelector('.reservation-open');
const reservationClose = document.querySelector('.reservation-close');

reservationOpen.addEventListener('click', function () {
  reservationModal.classList.add('is-open');
  reservationModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('reservation-lock');
});

reservationClose.addEventListener('click', function () {
  reservationModal.classList.remove('is-open');
  reservationModal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('reservation-lock');
});
