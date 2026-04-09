(() => {
    'use strict'
    const forms = document.querySelectorAll('.needs-validation')
    Array.from(forms).forEach(form => {
        form.addEventListener('submit', event => {
            if (!form.checkValidity()) {
                event.preventDefault()
                event.stopPropagation()
            }
            form.classList.add('was-validated')
        }, false)
    })
})()

document.addEventListener('DOMContentLoaded', function() {
    // Prevent booking dates in the past
    const checkInInput = document.getElementById('checkIn');
    const checkOutInput = document.getElementById('checkOut');

    if(checkInInput && checkOutInput) {
        let checkInPicker = flatpickr(checkInInput, {
            minDate: "today",
            onChange: function(selectedDates, dateStr, instance) {
                // Set the minimum check-out date to the day AFTER check-in
                checkOutPicker.set('minDate', selectedDates[0].fp_incr(1));
            }
        });

        let checkOutPicker = flatpickr(checkOutInput, {
            minDate: new Date().fp_incr(1) // Default to tomorrow
        });
    }
});