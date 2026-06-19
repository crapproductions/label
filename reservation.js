const reservationModal = document.getElementById('reservationModal');
const reservationOpen = document.querySelector('.reservation-open');
const reservationClose = document.querySelector('.reservation-close');

function closeReservationModal() {
  reservationModal.classList.remove('is-open');
  reservationModal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('reservation-lock');
}

reservationOpen.addEventListener('click', function () {
  reservationModal.classList.add('is-open');
  reservationModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('reservation-lock');
});

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
