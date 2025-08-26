
document.addEventListener('DOMContentLoaded', () => {
    const themeToggleButton = document.getElementById('theme-toggle');
    const body = document.body;

    // --- THEME MANAGEMENT ---

    // Function to apply the saved theme on load
    const applySavedTheme = () => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light') {
            body.classList.add('light-theme');
        }
    };

    // Function to toggle the theme
    const toggleTheme = () => {
        body.classList.toggle('light-theme');
        // Save the new theme preference
        if (body.classList.contains('light-theme')) {
            localStorage.setItem('theme', 'light');
        } else {
            localStorage.removeItem('theme');
        }
    };

    // Attach event listener to the theme toggle button
    if (themeToggleButton) {
        themeToggleButton.addEventListener('click', toggleTheme);
    }

    // Apply the theme when the page loads
    applySavedTheme();


    // --- SIDEBAR MANAGEMENT (EXAMPLE) ---
    // Example functions to demonstrate toggling the sidebar.
    // This can be wired up to module loading logic later.
    const contentWrapper = document.getElementById('content-wrapper');

    window.showSidebar = () => {
        if (contentWrapper) {
            contentWrapper.classList.add('with-sidebar');
        }
    };

    window.hideSidebar = () => {
        if (contentWrapper) {
            contentWrapper.classList.remove('with-sidebar');
        }
    };

    // --- WORKFLOW ITEM CLICK HANDLERS ---
    
    const workflowItems = document.querySelectorAll('.workflow-item');
    workflowItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            console.log(`Clicked on workflow item: ${item.querySelector('.item-text').textContent}`);
            // Add navigation logic here
        });
    });

    console.log('App shell initialized.');
    console.log('You can test the sidebar with showSidebar() and hideSidebar() in the console.');

});
