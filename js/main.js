// Globales State-Objekt
const state = {
    components: []
};

document.addEventListener('DOMContentLoaded', function() {
    const squares = document.querySelectorAll('.draggable-square');
    const contentArea = document.querySelector('.dot-grid');
    const statusText = document.getElementById('status-text');
    let draggedSquare = null;
    let isDragging = false;
    let currentColor = '';
    let lastSnappedX = 0;
    let lastSnappedY = 0;
    
    // Setze Position des Content-Bereichs auf relative
    contentArea.style.position = 'relative';

    // Mouse-Tracking im Content-Bereich
    contentArea.addEventListener('mousemove', function(e) {
        const contentRect = contentArea.getBoundingClientRect();
        const relativeX = Math.floor(e.clientX - contentRect.left);
        const relativeY = Math.floor(e.clientY - contentRect.top);
        
        statusText.textContent = `Status: (${relativeX}, ${relativeY})`;
    });

    contentArea.addEventListener('mouseleave', function() {
        statusText.textContent = 'Status: ';
    });

    squares.forEach(square => {
        square.addEventListener('mousedown', function(e) {
            e.preventDefault();
            isDragging = true;
            currentColor = window.getComputedStyle(this).backgroundColor;

            // Erstelle temporäres Quadrat
            draggedSquare = document.createElement('div');
            draggedSquare.style.width = '100px';
            draggedSquare.style.height = '100px';
            draggedSquare.style.backgroundColor = currentColor;
            draggedSquare.style.position = 'absolute';
            draggedSquare.style.pointerEvents = 'none';
            draggedSquare.style.zIndex = '1000';
            document.body.appendChild(draggedSquare);

            updateSquarePosition(e);
        });
    });

    document.addEventListener('mousemove', function(e) {
        if (isDragging && draggedSquare) {
            updateSquarePosition(e);
        }
    });

    document.addEventListener('mouseup', function(e) {
        if (isDragging && draggedSquare) {
            // Prüfe, ob das Quadrat über dem Content-Bereich ist
            const contentRect = contentArea.getBoundingClientRect();
            const mouseX = e.clientX;
            const mouseY = e.clientY;

            // Prüfe, ob das Quadrat vollständig im Content-Bereich ist
            // Maus muss mindestens 50px vom Rand entfernt sein (halbe Quadratgröße)
            if (mouseX >= contentRect.left + 50 && mouseX <= contentRect.right - 50 &&
                mouseY >= contentRect.top + 50 && mouseY <= contentRect.bottom - 50) {
                
                // Berechne die relative Position vom gerundeten Drag-Quadrat zum Content-Bereich
                const absoluteX = lastSnappedX - (contentRect.left + window.scrollX);
                const absoluteY = lastSnappedY - (contentRect.top + window.scrollY);
                
                // Runde auf 10er-Raster für saubere Koordinaten
                const relativeX = Math.round(absoluteX / 10) * 10;
                const relativeY = Math.round(absoluteY / 10) * 10;
                
                // Erstelle permanentes Quadrat im Content-Bereich
                const permanentSquare = document.createElement('div');
                permanentSquare.style.width = '100px';
                permanentSquare.style.height = '100px';
                permanentSquare.style.backgroundColor = currentColor;
                permanentSquare.style.position = 'absolute';
                permanentSquare.style.left = relativeX + 'px';
                permanentSquare.style.top = relativeY + 'px';
                
                contentArea.appendChild(permanentSquare);
                
                // Konvertiere RGB zu Farbnamen
                const colorName = rgbToColorName(currentColor);
                
                // Füge zum State hinzu
                state.components.push({
                    name: colorName,
                    x: relativeX,
                    y: relativeY
                });
                
                console.log('State:', state);
            }
            
            // Entferne temporäres Quadrat
            draggedSquare.remove();
            draggedSquare = null;
            isDragging = false;
        }
    });

    function updateSquarePosition(e) {
        if (draggedSquare) {
            // Runde auf 10er-Raster
            const snappedX = Math.round((e.pageX - 50) / 10) * 10;
            const snappedY = Math.round((e.pageY - 50) / 10) * 10;

            draggedSquare.style.left = snappedX + 'px';
            draggedSquare.style.top = snappedY + 'px';
            
            // Speichere die aktuellen Raster-Positionen
            lastSnappedX = snappedX;
            lastSnappedY = snappedY;
            
            // Prüfe, ob das Quadrat vollständig im Content-Bereich ist
            const contentRect = contentArea.getBoundingClientRect();
            const mouseX = e.clientX;
            const mouseY = e.clientY;
            
            if (mouseX >= contentRect.left + 50 && mouseX <= contentRect.right - 50 &&
                mouseY >= contentRect.top + 50 && mouseY <= contentRect.bottom - 50) {
                // Im Content-Bereich: voll sichtbar
                draggedSquare.style.opacity = '1';
            } else {
                // Außerhalb: halbtransparent
                draggedSquare.style.opacity = '0.5';
            }
        }
    }

    function rgbToColorName(rgb) {
        // Konvertiere RGB-String zu Farbnamen
        const colorMap = {
            'rgb(255, 0, 0)': 'red',
            'rgb(0, 128, 0)': 'green',
            'rgb(0, 0, 255)': 'blue'
        };
        return colorMap[rgb] || rgb;
    }
});
