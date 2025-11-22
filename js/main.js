// Globales State-Objekt
const state = {
    components: []
};

// Globale Variablen für Drag & Drop und Resize
let draggedCard = null;
let isDragging = false;
let isResizing = false;
let componentName = '';
let cardHTML = '';
let lastSnappedX = 0;
let lastSnappedY = 0;
let draggedFromContent = false;
let originalCard = null;
let componentIndex = -1;
let resizingCard = null;
let startX = 0;
let startY = 0;
let startWidth = 0;
let startHeight = 0;

// DOM-Elemente (werden bei main() initialisiert)
let contentArea = null;
let statusText = null;

// Event-Handler Funktionen

function handleMouseMoveInContentArea(e) {
    const contentRect = contentArea.getBoundingClientRect();
    const relativeX = Math.floor(e.clientX - contentRect.left);
    const relativeY = Math.floor(e.clientY - contentRect.top);

    statusText.textContent = `Status: (${relativeX}, ${relativeY})`;
}

function handleMouseLeaveContentArea() {
    statusText.textContent = 'Status: ';
}

function handleSidebarCardMouseDown(e) {
    startDragging(e, this, false);
}

function handleContentAreaMouseDown(e) {
    const resizeHandle = e.target.closest('.resize-handle');
    if (resizeHandle) {
        e.preventDefault();
        e.stopPropagation();
        startResizing(e, resizeHandle.parentElement);
        return;
    }

    const clickedCard = e.target.closest('.placed-card');
    if (clickedCard) {
        startDragging(e, clickedCard, true);
    }
}

function handleDocumentMouseMove(e) {
    if (isResizing && resizingCard) {
        handleResizeMove(e);
    } else if (isDragging && draggedCard) {
        updateCardPosition(e);
    }
}

function handleDocumentMouseUp(e) {
    if (isResizing && resizingCard) {
        handleResizeEnd();
    } else if (isDragging && draggedCard) {
        handleDragEnd(e);
    }
}

function startResizing(e, card) {
    isResizing = true;
    resizingCard = card;
    startX = e.clientX;
    startY = e.clientY;

    const rect = card.getBoundingClientRect();
    startWidth = rect.width;
    startHeight = rect.height;

    // Finde Index im State
    const posX = parseInt(card.style.left);
    const posY = parseInt(card.style.top);
    const actualCard = card.querySelector('.card');
    const name = actualCard ? actualCard.dataset.componentName : card.dataset.componentName;
    componentIndex = state.components.findIndex(c => c.x === posX && c.y === posY && c.name === name);
}

function handleResizeMove(e) {
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    // Runde auf 10er-Raster
    const newWidth = Math.max(100, Math.round((startWidth + deltaX) / 10) * 10);
    const newHeight = Math.max(80, Math.round((startHeight + deltaY) / 10) * 10);

    resizingCard.style.width = newWidth + 'px';
    resizingCard.style.height = newHeight + 'px';
}

function handleResizeEnd() {
    // Aktualisiere State mit neuen Dimensionen
    if (componentIndex >= 0) {
        const rect = resizingCard.getBoundingClientRect();
        state.components[componentIndex].width = rect.width;
        state.components[componentIndex].height = rect.height;
        console.log('State:', state);
    }

    isResizing = false;
    resizingCard = null;
    componentIndex = -1;
}

function startDragging(e, sourceCard, fromContent) {
    e.preventDefault();
    isDragging = true;
    draggedFromContent = fromContent;

    // Bei platzierten Cards ist das erste Child-Element die eigentliche Card
    const actualCard = sourceCard.classList.contains('card') ? sourceCard : sourceCard.querySelector('.card');
    componentName = actualCard ? actualCard.dataset.componentName : sourceCard.dataset.componentName;
    cardHTML = actualCard ? actualCard.outerHTML : sourceCard.outerHTML;

    // Ermittle die tatsächliche Größe und Position der Quell-Card
    let sourceWidth, sourceHeight;
    const sourceRect = actualCard ? actualCard.getBoundingClientRect() : sourceCard.getBoundingClientRect();
    sourceWidth = sourceRect.width;
    sourceHeight = sourceRect.height;

    if (fromContent) {
        // Merke die originale Card und ihren Index im State
        originalCard = sourceCard;
        const posX = parseInt(sourceCard.style.left);
        const posY = parseInt(sourceCard.style.top);
        componentIndex = state.components.findIndex(c => c.x === posX && c.y === posY && c.name === componentName);

        // Verstecke die originale Card während des Draggings
        originalCard.style.opacity = '0';
        originalCard.style.visibility = 'hidden';
    }

    // Erstelle temporäre Card
    draggedCard = document.createElement('div');
    draggedCard.innerHTML = cardHTML;
    const innerCard = draggedCard.querySelector('.card');
    if (innerCard) {
        draggedCard = innerCard;
    }
    draggedCard.style.position = 'absolute';
    draggedCard.style.pointerEvents = 'none';
    draggedCard.style.zIndex = '1000';
    draggedCard.style.width = sourceWidth + 'px';
    draggedCard.style.height = sourceHeight + 'px';

    // Setze die initiale Position der draggedCard an die Position der Quell-Card


    console.log(sourceRect.left, sourceRect.top);
    console.log(e.clientX, e.clientY);
    console.log(e.clientX - sourceRect.left, e.clientY - sourceRect.top);
    console.log(e.screenX, e.screenY);

    // console.log("sourceRect.left", sourceRect.left);
    // console.log("window.scrollX", window.scrollX);
    // console.log("draggedCard.style.width", draggedCard.style.width);

    // Speichere die initialen Snap-Positionen
    lastSnappedX = sourceRect.left + window.scrollX - draggedCard.style.width / 2;
    lastSnappedY = sourceRect.top + window.scrollY - draggedCard.style.height / 2;

    // lastSnappedX = e.clientX;
    // lastSnappedY = e.clientY;

    lastSnappedX = sourceRect.left - draggedCard.style.width / 2;
    lastSnappedY = sourceRect.top - draggedCard.style.height / 2;

    draggedCard.style.left = lastSnappedX + 'px';
    draggedCard.style.top = lastSnappedY + 'px';

    document.body.appendChild(draggedCard);

}

function handleDragEnd(e) {
    // Prüfe, ob die Card über dem Content-Bereich ist
    const contentRect = contentArea.getBoundingClientRect();
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    // Berechne die Dimensionen der Card
    const cardRect = draggedCard.getBoundingClientRect();
    const cardWidth = cardRect.width;
    const cardHeight = cardRect.height;

    // Prüfe, ob die Card vollständig im Content-Bereich ist
    if (mouseX >= contentRect.left + cardWidth / 2 && mouseX <= contentRect.right - cardWidth / 2 &&
        mouseY >= contentRect.top + cardHeight / 2 && mouseY <= contentRect.bottom - cardHeight / 2) {

        // Berechne die relative Position vom gerundeten Drag-Card zum Content-Bereich
        const absoluteX = lastSnappedX - (contentRect.left + window.scrollX);
        const absoluteY = lastSnappedY - (contentRect.top + window.scrollY);

        // Runde auf 10er-Raster für saubere Koordinaten, ohne Offset
        const relativeX = Math.max(0, Math.round(absoluteX / 10) * 10);
        const relativeY = Math.max(0, Math.round(absoluteY / 10) * 10);

        if (draggedFromContent && originalCard) {
            // Bewege die existierende Card
            originalCard.style.left = relativeX + 'px';
            originalCard.style.top = relativeY + 'px';
            originalCard.style.opacity = '1';
            originalCard.style.visibility = 'visible';

            // Aktualisiere State
            if (componentIndex >= 0) {
                state.components[componentIndex].x = relativeX;
                state.components[componentIndex].y = relativeY;
            }
        } else {
            // Erstelle neue permanente Card im Content-Bereich
            createPlacedCard(relativeX, relativeY);
        }

        console.log('State:', state);
    } else {
        // Card wurde außerhalb fallengelassen
        if (draggedFromContent && originalCard) {
            // Entferne die Card aus dem Content-Bereich und aus dem State
            originalCard.remove();
            if (componentIndex >= 0) {
                state.components.splice(componentIndex, 1);
            }
            console.log('State:', state);
        }
        // Wenn aus Seitenleiste gezogen: einfach verschwinden lassen (nichts zu tun)
    }

    // Entferne temporäre Card
    draggedCard.remove();
    draggedCard = null;
    isDragging = false;
    draggedFromContent = false;
    originalCard = null;
    componentIndex = -1;
}

function createPlacedCard(relativeX, relativeY) {
    const permanentCard = document.createElement('div');
    permanentCard.innerHTML = cardHTML;
    const cardElement = permanentCard.firstElementChild;
    cardElement.classList.add('placed-card');
    cardElement.style.position = 'absolute';
    cardElement.style.left = relativeX + 'px';
    cardElement.style.top = relativeY + 'px';

    // Füge Resize-Handle hinzu
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'resize-handle';
    cardElement.appendChild(resizeHandle);

    contentArea.appendChild(cardElement);

    // Füge zum State hinzu
    state.components.push({
        name: componentName,
        x: relativeX,
        y: relativeY,
        width: cardElement.style.width,
        height: cardElement.style.height
    });
}

function updateCardPosition(e) {
    if (draggedCard) {
        // Berechne Position relativ zum Content-Bereich
        const contentRect = contentArea.getBoundingClientRect();
        const cardRect = draggedCard.getBoundingClientRect();
        const cardWidth = cardRect.width;
        const cardHeight = cardRect.height;

        const relativeX = e.pageX - (contentRect.left + window.scrollX) - cardWidth / 2;
        const relativeY = e.pageY - (contentRect.top + window.scrollY) - cardHeight / 2;

        // Runde auf 10er-Raster, ohne Minimum-Offset
        const snappedRelX = Math.round(relativeX / 10) * 10;
        const snappedRelY = Math.round(relativeY / 10) * 10;

        // Konvertiere zurück zu absoluten Koordinaten für die Anzeige
        const snappedX = snappedRelX + (contentRect.left + window.scrollX);
        const snappedY = snappedRelY + (contentRect.top + window.scrollY);

        draggedCard.style.left = snappedX + 'px';
        draggedCard.style.top = snappedY + 'px';

        // Speichere die aktuellen Raster-Positionen
        lastSnappedX = snappedX;
        lastSnappedY = snappedY;

        // Prüfe, ob die Card vollständig im Content-Bereich ist
        const mouseX = e.clientX;
        const mouseY = e.clientY;

        if (mouseX >= contentRect.left + cardWidth / 2 && mouseX <= contentRect.right - cardWidth / 2 &&
            mouseY >= contentRect.top + cardHeight / 2 && mouseY <= contentRect.bottom - cardHeight / 2) {
            // Im Content-Bereich: voll sichtbar
            draggedCard.style.opacity = '1';
        } else {
            // Außerhalb: halbtransparent
            draggedCard.style.opacity = '0.5';
        }
    }
}

// Initialisierung
async function main() {
    // Initialisiere DOM-Elemente
    const cards = document.querySelectorAll('.draggable-card');
    contentArea = document.querySelector('.content-area');
    statusText = document.getElementById('status-text');

    // Registriere Event-Listener
    contentArea.addEventListener('mousemove', handleMouseMoveInContentArea);
    contentArea.addEventListener('mouseleave', handleMouseLeaveContentArea);
    contentArea.addEventListener('mousedown', handleContentAreaMouseDown);

    document.addEventListener('mousemove', handleDocumentMouseMove);
    document.addEventListener('mouseup', handleDocumentMouseUp);

    // Event-Listener für Cards in der Seitenleiste
    cards.forEach(card => {
        card.addEventListener('mousedown', handleSidebarCardMouseDown);
    });



}

// Initialisierung
main();
