


const seat = document.querySelectorAll(`.col`);
const session_id = document.getElementById('session_id').textContent.trim();
const seat_status = document.getElementById('seat_status').textContent.trim();

function addEventListenerList(list, event, fn) {
    for (var i = 0, len = list.length; i < len; i++) {
        list[i].addEventListener(event, fn);
    }
}
const updateSeat = async (seat) => {
    const seat_num = new URLSearchParams({ seat_num: seat.firstElementChild.innerText.replace(/[a-z, ]/gi, '') });
    seat_num.append('session_id', session_id);
    await axios.put(`/sessions/${session_id}/seat`, seat_num)
        .then(function (response) {
            window.location.reload()
        })
        .catch(function (error) {
            if (error.request.responseURL.includes('/login')) {
                window.location = '/login?redirect=' + session_id;
            }
            console.log(error.response.data);
            console.log(error);
        });
}
function log() {
    if (window.confirm("Do you want to rent the seat?")) {
        updateSeat(this)
    }

};
addEventListenerList(seat, 'click', log);

setInterval(async () => {
    const session = new URLSearchParams({ session: session_id });
    session.append('seat_status', seat_status);
    await axios.post('/sessions/checkChange', session)
        .then(function (response) {
            if ((response.data == true)) {
                window.location.reload()
            }

        })
        .catch(function (error) {
            console.log()
        });
}, 15000)