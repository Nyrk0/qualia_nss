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

        console.log('Initializing scroll-fade for:', containerSelector, container);

        const handleScroll = () => {
            const scrollEndTolerance = 2;
            const showTopFade = container.scrollTop > 0;
            const showBottomFade = container.scrollTop < (container.scrollHeight - container.clientHeight - scrollEndTolerance);
            
            // Debug: Check if classes are being applied
            console.log('Fade Debug:', {
                selector: containerSelector,
                scrollTop: container.scrollTop,
                showTopFade,
                showBottomFade,
                topFadeClass: container.classList.contains('show-top-fade'),
                bottomFadeClass: container.classList.contains('show-bottom-fade')
            });
            
            container.classList.toggle('show-top-fade', showTopFade);
            container.classList.toggle('show-bottom-fade', showBottomFade);
        };

        container.addEventListener('scroll', handleScroll);
        window.addEventListener('resize', handleScroll);
        handleScroll();
    }

    // Fixed fade version: monitors scrollContainer but applies fade to targetContainer
    function initializeScrollFadeFixed(scrollContainerSelector, targetContainerSelector) {
        const scrollContainer = document.querySelector(scrollContainerSelector);
        const targetContainer = document.querySelector(targetContainerSelector);

        if (!scrollContainer) {
            console.error(`Scroll container with selector "${scrollContainerSelector}" not found.`);
            return;
        }
        if (!targetContainer) {
            console.error(`Target container with selector "${targetContainerSelector}" not found.`);
            return;
        }

        console.log('Initializing fixed scroll-fade - monitoring:', scrollContainerSelector, 'applying to:', targetContainerSelector);

        const handleScroll = () => {
            const scrollEndTolerance = 2;
            const showTopFade = scrollContainer.scrollTop > 0;
            const showBottomFade = scrollContainer.scrollTop < (scrollContainer.scrollHeight - scrollContainer.clientHeight - scrollEndTolerance);
            
            // Debug: Check if classes are being applied
            console.log('Fixed Fade Debug:', {
                scrollSelector: scrollContainerSelector,
                targetSelector: targetContainerSelector,
                scrollTop: scrollContainer.scrollTop,
                showTopFade,
                showBottomFade
            });
            
            // Apply fade classes to target container (sidebar), not scroll container
            targetContainer.classList.toggle('show-top-fade', showTopFade);
            targetContainer.classList.toggle('show-bottom-fade', showBottomFade);
        };

        scrollContainer.addEventListener('scroll', handleScroll);
        window.addEventListener('resize', handleScroll);
        
        // Initial check with multiple attempts to ensure content is loaded
        handleScroll();
        setTimeout(handleScroll, 100);
        setTimeout(handleScroll, 300);
        setTimeout(handleScroll, 500);
        
        // Watch for content changes (accordion expand/collapse)
        const observer = new MutationObserver(() => {
            setTimeout(handleScroll, 50);
        });
        observer.observe(scrollContainer, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'style']
        });
    }

    // Make both functions globally available
    window.initializeScrollFade = initializeScrollFade;
    window.initializeScrollFadeFixed = initializeScrollFadeFixed;

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