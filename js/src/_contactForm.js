/* global ga */

var zepto = require('zepto-browserify').Zepto;
var $ = document.querySelector.bind(document);

var elNameField = $('.mail-form [name=name]');
var elEmailField = $('.mail-form [name=email]');
var elMessageField = $('.mail-form [name=message]');
var elContactFormSubmit = $('.mail-form .submit');


function updateValidity(evt){
    var target = evt && evt.target || this;

    if(target.validity.valid){
      target.setAttribute('data-isvalid', true);
    } else {
      target.setAttribute('data-isvalid', false);
    }
}

[elNameField, elEmailField, elMessageField].forEach(function(el){
  // updateValidity.call(el);
  el.addEventListener('input', updateValidity , false);
});

function formIsValid(){
  var valid = true;
  [elNameField, elEmailField, elMessageField].forEach(function(el){
    if(!el.validity.valid){
      valid = false;
    }
  });
  return valid;
}

function showErrors(){
  $('.mail-form').classList.add('show-errors');
}

var resetSendButton = function() {
  elContactFormSubmit.classList.remove('success');
  elContactFormSubmit.classList.remove('failure');
  elContactFormSubmit.innerHTML = 'Send';
};

var mailerSuccess = function() {
  elNameField.value = '';
  elEmailField.value = '';
  elMessageField.value = '';
  elContactFormSubmit.classList.add('success');
  elContactFormSubmit.innerHTML = 'Message sent!';
  ga('send', 'event', 'Contact', 'sent contact email', 'Contact Modal');
  setTimeout(resetSendButton, 3000);
};

var mailerFailure = function() {
  elContactFormSubmit.classList.add('failure');
  elContactFormSubmit.innerHTML = 'Please try again';
  setTimeout(resetSendButton, 3000);
};

var attemptsCounter = 0;
var submitAction = function() {
  elContactFormSubmit.innerHTML = 'Sending...';

  var dataObject = {};
  dataObject.name = elNameField.value;
  dataObject.email = elEmailField.value;
  dataObject.message = elMessageField.value;

  zepto.ajax({
    type: 'POST',
    url: '/contact',
    data: JSON.stringify(dataObject),
    contentType: 'application/json',
    success: function() { // data
      mailerSuccess();
    },
    error: function() { // xhr, type
      attemptsCounter += 1;
      if(attemptsCounter < 10) {
        setTimeout(submitAction.bind(this), 1000);
        console.log('Email send error, trying again...');
      } else {
        attemptsCounter = 0;
        mailerFailure();
      } 
    }
  });
};

elContactFormSubmit.addEventListener('click', function(event) {
  if(formIsValid()){
    event.preventDefault();
    submitAction();
  } else {
    showErrors();
  }
});
