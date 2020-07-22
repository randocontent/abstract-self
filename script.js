let step = 0;
setStep(step);

$('button.next-step').on('click',function(e){
step++;
setStep(step)
})

function setStep(step){
	$('.step').addClass('d-none')
	$('#step-'+step).removeClass('d-none')
}