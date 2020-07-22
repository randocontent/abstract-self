let started = false;

$(document).ready(function () {
	gotoStep(getStep());
});

$('button.next-step').on('click', function (e) {
	started = true;
	let step = getStep();
	step++;
	gotoStep(step);
});

function gotoStep(step) {
	// Only move ahead if "started" is true (otherwise reset back to step 0)
	if (started) {
		// Only move ahead if the requested step is valid
		if (step === 0 || step === 1 || step === 2 || step === 3) {
			// First hide everything
			$('.step').addClass('d-none');
			// Then show just the step we wanted
			$('#step-' + step).removeClass('d-none');
			// Then update the URL with the new state
			history.pushState('', 'step ' + step, '#' + step);
		}
	} else {
			// First hide everything
			$('.step').addClass('d-none');
			// Then show just step 0
			$('#step-0').removeClass('d-none');
			// Then clear the bad hash
				history.pushState("", document.title, window.location.pathname + window.location.search);

	}
}

function getStep() {
	let url = new URL(window.location.href);
	let hash = url.hash.substring(1);
	if (hash === '0' || hash === '1' || hash === '2' || hash === '3') {
		return parseInt(hash,10);
	} else {
		return '0';
	}
}

