// ====================================================================
// SIMON42 EDITOR HANDLERS
// ====================================================================
// Event-Handler für den Dashboard Strategy Editor

export function attachEnergyCheckboxListener(element, callback) {
  const energyCheckbox = element.querySelector('#show-energy');
  if (energyCheckbox) {
    energyCheckbox.addEventListener('change', (e) => {
      callback(e.target.checked);
    });
  }
}

export function attachAreaCheckboxListeners(element, callback) {
  const areaCheckboxes = element.querySelectorAll('.area-checkbox');
  areaCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const areaId = e.target.dataset.areaId;
      const isVisible = e.target.checked;
      callback(areaId, isVisible);
    });
  });
}

export function sortAreaItems(element) {
  const areaList = element.querySelector('#area-list');
  if (!areaList) return;

  const items = Array.from(areaList.querySelectorAll('.area-item'));
  items.sort((a, b) => {
    const orderA = parseInt(a.dataset.order);
    const orderB = parseInt(b.dataset.order);
    return orderA - orderB;
  });

  items.forEach(item => areaList.appendChild(item));
}

export function attachDragAndDropListeners(element, onOrderChange) {
  const areaItems = element.querySelectorAll('.area-item');
  
  let draggedElement = null;

  const handleDragStart = (ev) => {
    ev.currentTarget.classList.add('dragging');
    ev.dataTransfer.effectAllowed = 'move';
    ev.dataTransfer.setData('text/html', ev.currentTarget.innerHTML);
    draggedElement = ev.currentTarget;
  };

  const handleDragEnd = (ev) => {
    ev.currentTarget.classList.remove('dragging');
    
    // Entferne alle drag-over Klassen
    const items = element.querySelectorAll('.area-item');
    items.forEach(item => item.classList.remove('drag-over'));
  };

  const handleDragOver = (ev) => {
    if (ev.preventDefault) {
      ev.preventDefault();
    }
    ev.dataTransfer.dropEffect = 'move';
    
    const item = ev.currentTarget;
    if (item !== draggedElement) {
      item.classList.add('drag-over');
    }
    
    return false;
  };

  const handleDragLeave = (ev) => {
    ev.currentTarget.classList.remove('drag-over');
  };

  const handleDrop = (ev) => {
    if (ev.stopPropagation) {
      ev.stopPropagation();
    }

    const dropTarget = ev.currentTarget;
    dropTarget.classList.remove('drag-over');

    if (draggedElement !== dropTarget) {
      const areaList = element.querySelector('#area-list');
      const allItems = Array.from(areaList.querySelectorAll('.area-item'));
      const draggedIndex = allItems.indexOf(draggedElement);
      const dropIndex = allItems.indexOf(dropTarget);

      if (draggedIndex < dropIndex) {
        dropTarget.parentNode.insertBefore(draggedElement, dropTarget.nextSibling);
      } else {
        dropTarget.parentNode.insertBefore(draggedElement, dropTarget);
      }

      // Update die Reihenfolge in der Config
      onOrderChange();
    }

    return false;
  };

  areaItems.forEach(item => {
    item.addEventListener('dragstart', handleDragStart);
    item.addEventListener('dragend', handleDragEnd);
    item.addEventListener('dragover', handleDragOver);
    item.addEventListener('drop', handleDrop);
    item.addEventListener('dragleave', handleDragLeave);
  });
}
