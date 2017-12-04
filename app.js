(function() {
  var config = {
    apiKey: "AIzaSyA_uxSJZvVc0BR-2-3EaBCgdipwehZp520",
    authDomain: "coolbong-otp.firebaseapp.com",
    databaseURL: "https://coolbong-otp.firebaseio.com",
    projectId: "coolbong-otp",
    storageBucket: "coolbong-otp.appspot.com",
    messagingSenderId: "431150467036"
  };
  firebase.initializeApp(config);


  const uiList = document.getElementById('list');
  const dbRefList = firebase.database().ref().child('otp');
  //const dbRefList = firebase.database().ref().

  // dbRefList.on('value', function(snap) {
  //   console.log(JSON.stringify(snap.val(), null, 3));
  // });

  dbRefList.on('child_added', function(snap) {
    const li = document.createElement('li');
    li.innerText = snap.val().otpvalue;
    uiList.appendChild(li);
    //console.log(JSON.stringify(snap.val(), null, 3));
  });

}());

