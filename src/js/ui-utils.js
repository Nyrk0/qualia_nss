/**
 * UI Utils - Common UI utilities and effects
 * Part of the Qualia-NSS modular architecture
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- SCROLL FADE FUNCTIONALITY ---
    function initializeScrollFade(containerSelector) {
        const container = document.querySelector(containerSelector);

        if (!container) {
            console.error(`Scroll-fade container with selector "${containerSelector}" not found.`);
            return;
        }

        const handleScroll = () => {
            const scrollEndTolerance = 2;
            const showTopFade = container.scrollTop > 0;
            container.classList.toggle('show-top-fade', showTopFade);
            const showBottomFade = container.scrollTop < (container.scrollHeight - container.clientHeight - scrollEndTolerance);
            container.classList.toggle('show-bottom-fade', showBottomFade);
        };

        container.addEventListener('scroll', handleScroll);
        window.addEventListener('resize', handleScroll);
        handleScroll();
    }

    // Make initializeScrollFade globally available
    window.initializeScrollFade = initializeScrollFade;

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
    workflowItems.forEach((item) => {
        item.addEventListener('click', () => {
            console.log(`Clicked on workflow item: ${item.querySelector('.item-text').textContent}`);
            // Add navigation logic here
        });
    });

    console.log('UI utilities initialized.');
});