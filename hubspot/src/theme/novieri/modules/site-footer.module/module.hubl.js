/** The footer link that reopens the cookie banner. */
document.querySelectorAll(".cookie-settings").forEach(function (button) {
  button.addEventListener("click", function () {
    document.documentElement.classList.add("needs-consent");
  });
});
