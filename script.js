function showTestament(testament) {
    const sections = document.querySelectorAll('.testament-section');
    sections.forEach(section => section.classList.remove('active'));
    const buttons = document.querySelectorAll('.tab-button');
    buttons.forEach(button => button.classList.remove('active'));
    if (testament === 'old') {
        document.getElementById('old-testament').classList.add('active');
        buttons[0].classList.add('active');
    } else if (testament === 'new') {
        document.getElementById('new-testament').classList.add('active');
        buttons[1].classList.add('active');
    }
}
