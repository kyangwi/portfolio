// Initialize required components
document.addEventListener('DOMContentLoaded', function() {
    initializeEditor();
    initializeMobileMenu();
    
    // Global click handler for block menu interactions
    document.addEventListener('click', function(e) {
        const addBlockBtn = e.target.closest('.add-block-btn');
        const blockMenuBtn = e.target.closest('[data-block-type]');
        const blockMenu = document.getElementById('block-menu');
        
        if (addBlockBtn) {
            showBlockMenu(e, addBlockBtn);
        } else if (blockMenuBtn && blockMenu && blockMenuBtn.closest('#block-menu')) {
            const blockType = blockMenuBtn.dataset.blockType;
            const sourceBlockId = blockMenu.dataset.sourceButton;
            const sourceBlock = document.querySelector(`[data-id="${sourceBlockId}"]`);
            addNewBlock(blockType, sourceBlock);
            hideBlockMenu();
        } else if (!e.target.closest('#block-menu')) {
            hideBlockMenu();
        }
    });

    // Close block menu with escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            hideBlockMenu();
        }
    });

    feather.replace();
    AOS.init({
        duration: 800,
        easing: 'ease-in-out',
        once: true
    });
});

function initializeMobileMenu() {
    const menuBtn = document.getElementById('menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    let isMenuOpen = false;

    if (!menuBtn || !mobileMenu) return;

    function closeMobileMenu() {
        mobileMenu.classList.add('hidden');
        menuBtn.innerHTML = feather.icons.menu.toSvg();
        isMenuOpen = false;
    }

    menuBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        isMenuOpen = !isMenuOpen;
        mobileMenu.classList.toggle('hidden');
        this.innerHTML = isMenuOpen ? feather.icons.x.toSvg() : feather.icons.menu.toSvg();
    });

    document.addEventListener('click', function(e) {
        if (isMenuOpen && !mobileMenu.contains(e.target) && e.target !== menuBtn) {
            closeMobileMenu();
        }
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth >= 768) {
            closeMobileMenu();
        }
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && isMenuOpen) {
            closeMobileMenu();
        }
    });
}

function initializeEditor() {
    const editor = {
        toolbar: document.getElementById('formatting-toolbar'),
        blockMenu: document.getElementById('block-menu'),
        contentBlocks: document.getElementById('content-blocks'),
        titleInput: document.querySelector('input[placeholder="Your Article Title"]'),
        descriptionInput: document.getElementById('post-description'),
        activeBlock: null,
        selection: null
    };

    if (!editor.titleInput || !editor.descriptionInput || !editor.contentBlocks) {
        console.error('Required editor elements not found');
        return;
    }

    // Initialize description field
    const descriptionInput = editor.descriptionInput;
    descriptionInput.addEventListener('input', function() {
        const remainingChars = 200 - this.value.length;
        const message = remainingChars >= 0 ? 
            `${remainingChars} characters remaining` : 
            `${Math.abs(remainingChars)} characters over limit`;
        
        // Update character counter or show in a tooltip
        this.title = `${this.value.length}/200 characters. ${message}`;
        
        // Add visual feedback
        if (this.value.length < 50) {
            this.classList.add('border-yellow-500');
            this.classList.remove('border-red-500', 'border-green-500');
        } else if (this.value.length > 200) {
            this.classList.add('border-red-500');
            this.classList.remove('border-yellow-500', 'border-green-500');
        } else {
            this.classList.add('border-green-500');
            this.classList.remove('border-yellow-500', 'border-red-500');
        }
    });

    // Auto-resize description textarea
    descriptionInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });

    // Initialize featured image upload
    initializeFeaturedImage();

    // Delete post functionality
    window.deletePost = async function(postId) {
        if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`/api/delete-post/${postId}`, {
                method: 'DELETE',
            });

            const result = await response.json();
            
            if (response.ok) {
                showNotification('Post deleted successfully', 'success');
                // Remove the post card from the UI
                const postCard = document.querySelector(`[data-post-id="${postId}"]`);
                if (postCard) {
                    postCard.remove();
                } else {
                    // If we can't find the card, just reload the page
                    window.location.reload();
                }
            } else {
                throw new Error(result.message || 'Failed to delete post');
            }
        } catch (error) {
            console.error('Error deleting post:', error);
            showNotification('Error deleting post: ' + error.message, 'error');
        }
    };

    // Handle text selection for toolbar
    document.addEventListener('selectionchange', function() {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const selectedText = selection.toString();
            
            if (selectedText && selectedText.length > 0) {
                const rect = range.getBoundingClientRect();
                showFormattingToolbar(rect);
            } else {
                hideFormattingToolbar();
            }
        }
    });

    // Handle formatting toolbar actions
    document.querySelectorAll('#formatting-toolbar button').forEach(button => {
        button.addEventListener('click', function() {
            const format = this.dataset.format;
            applyFormatting(format);
        });
    });

    // Close menus when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('#formatting-toolbar') && !e.target.closest('#block-menu')) {
            hideFormattingToolbar();
            hideBlockMenu();
        }
    });

    // Initialize placeholder text behavior
    document.querySelectorAll('[data-placeholder]').forEach(element => {
        element.addEventListener('focus', function() {
            if (this.textContent === '') {
                this.classList.add('empty');
            }
        });

        element.addEventListener('blur', function() {
            if (this.textContent === '') {
                this.classList.remove('empty');
            }
        });
    });

    // Auto-save every 30 seconds
    setInterval(saveDraft, 30000);
}

function initializeFeaturedImage() {
    const addFeaturedImageBtn = document.getElementById('add-featured-image');
    const featuredImagePreview = document.getElementById('featured-image-preview');
    const previewImg = featuredImagePreview?.querySelector('img');
    
    if (!addFeaturedImageBtn || !featuredImagePreview || !previewImg) {
        console.error('Required featured image elements not found');
        return;
    }
    
    addFeaturedImageBtn.addEventListener('click', function() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = function(e) {
            const file = e.target.files[0];
            if (file) {
                // Validate file type
                if (!file.type.startsWith('image/')) {
                    showNotification('Please select an image file', 'error');
                    return;
                }
                
                // Validate file size (max 5MB)
                if (file.size > 5 * 1024 * 1024) {
                    showNotification('Image size should be less than 5MB', 'error');
                    return;
                }

                const reader = new FileReader();
                reader.onload = function(e) {
                    previewImg.src = e.target.result;
                    previewImg.alt = file.name;
                    featuredImagePreview.classList.remove('hidden');
                    addFeaturedImageBtn.classList.add('hidden');
                    showNotification('Featured image added successfully', 'success');
                };
                reader.onerror = function() {
                    showNotification('Error reading the image file', 'error');
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    });

    // Remove featured image
    const removeBtn = featuredImagePreview.querySelector('button');
    if (removeBtn) {
        removeBtn.addEventListener('click', function() {
            featuredImagePreview.classList.add('hidden');
            addFeaturedImageBtn.classList.remove('hidden');
            previewImg.src = '';
            previewImg.alt = '';
            showNotification('Featured image removed', 'info');
        });
    }

    // Check for existing image in local storage
    const draft = localStorage.getItem('blog-draft-backup');
    if (draft) {
        try {
            const draftData = JSON.parse(draft);
            if (draftData.featured_image) {
                previewImg.src = draftData.featured_image;
                previewImg.alt = 'Restored featured image';
                featuredImagePreview.classList.remove('hidden');
                addFeaturedImageBtn.classList.add('hidden');
            }
        } catch (error) {
            console.error('Error restoring featured image from draft:', error);
        }
    }
}

function showBlockMenu(event, button) {
    const blockMenu = document.getElementById('block-menu');
    if (!blockMenu) return;
    
    // Store the reference to the button for later use
    blockMenu.dataset.sourceButton = button.closest('.block-container')?.dataset.id || '';
    
    const rect = button.getBoundingClientRect();
    const menuWidth = 256; // width of the menu in pixels
    
    // Position the menu, ensuring it stays within viewport
    const left = Math.min(rect.left + 30, window.innerWidth - menuWidth - 20);
    blockMenu.style.top = `${rect.top + window.scrollY}px`;
    blockMenu.style.left = `${left}px`;
    blockMenu.classList.remove('hidden');
    
    // Stop event propagation
    event.stopPropagation();
}

function hideBlockMenu() {
    const blockMenu = document.getElementById('block-menu');
    if (blockMenu) {
        blockMenu.classList.add('hidden');
        blockMenu.dataset.sourceButton = '';
    }
}

function showFormattingToolbar(rect) {
    const toolbar = document.getElementById('formatting-toolbar');
    if (!toolbar) return;
    
    // Position the toolbar above the selection
    toolbar.style.top = `${rect.top + window.scrollY - toolbar.offsetHeight - 10}px`;
    toolbar.style.left = `${rect.left + (rect.width - toolbar.offsetWidth) / 2}px`;
    toolbar.classList.remove('hidden');
}

function hideFormattingToolbar() {
    const toolbar = document.getElementById('formatting-toolbar');
    if (toolbar) {
        toolbar.classList.add('hidden');
    }
}

function addNewBlock(type, afterBlock = null) {
    const contentBlocks = document.getElementById('content-blocks');
    if (!contentBlocks) return;

    const container = document.createElement('div');
    container.className = 'block-container relative group mb-6';
    container.dataset.id = Date.now().toString();
    
    // Add block button
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'add-block-btn absolute -left-10 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-100';
    addBtn.innerHTML = `<i data-feather="plus" class="w-4 h-4 text-gray-400"></i>`;
    container.appendChild(addBtn);
    
    // Add delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'absolute -right-10 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-100';
    deleteBtn.innerHTML = `<i data-feather="trash-2" class="w-4 h-4 text-red-500"></i>`;
    deleteBtn.onclick = function() {
        if (confirm('Are you sure you want to delete this block?')) {
            container.remove();
        }
    };
    container.appendChild(deleteBtn);

    // Create content element based on type
    let content;
    switch (type) {
        case 'text':
            content = document.createElement('div');
            content.className = 'block-content prose max-w-none focus:outline-none';
            content.contentEditable = true;
            content.dataset.placeholder = 'Type your content...';
            content.dataset.type = 'text';
            break;
            
        case 'heading':
            content = document.createElement('div');
            content.className = 'block-content text-2xl font-bold mb-4 focus:outline-none';
            content.contentEditable = true;
            content.dataset.placeholder = 'Type your heading...';
            content.dataset.type = 'heading';
            break;

        case 'image':
            content = createImageBlock();
            break;

        case 'video':
            content = createVideoBlock();
            break;
            
        case 'code':
            content = createCodeBlock();
            break;

        case 'terminal':
            content = createTerminalBlock();
            break;
            
        case 'quote':
            content = createQuoteBlock();
            break;

        case 'list':
            content = createListBlock();
            break;

        case 'divider':
            content = createDividerBlock();
            break;
            
        default:
            content = document.createElement('div');
            content.className = 'block-content prose max-w-none focus:outline-none';
            content.contentEditable = true;
            content.dataset.placeholder = 'Type your content...';
            content.dataset.type = 'text';
            break;
    }

    container.appendChild(content);
    
    if (afterBlock) {
        afterBlock.after(container);
    } else {
        contentBlocks.appendChild(container);
    }
    
    feather.replace();

    if (content.contentEditable === 'true') {
        content.focus();
    }
    
    // Ensure data-type is set
    if (!content.dataset.type) {
        content.dataset.type = type;
    }
}

function createImageBlock() {
    const wrapper = document.createElement('div');
    wrapper.className = 'relative group';
    wrapper.dataset.type = 'image';
    
    const uploadBtn = document.createElement('button');
    uploadBtn.className = 'w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-gray-400 transition-colors';
    uploadBtn.innerHTML = `
        <i data-feather="image" class="w-8 h-8 text-gray-400 mb-2"></i>
        <span class="text-sm text-gray-500">Click to upload image</span>
    `;
    
    uploadBtn.onclick = function() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    img.className = 'w-full rounded-lg';
                    wrapper.replaceChild(img, uploadBtn);
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    };
    
    wrapper.appendChild(uploadBtn);
    return wrapper;
}

function createCodeBlock() {
    const wrapper = document.createElement('div');
    wrapper.className = 'relative';
    wrapper.dataset.type = 'code';
    
    const select = document.createElement('select');
    select.className = 'absolute top-2 right-2 text-sm bg-gray-800 text-white rounded px-2 py-1';
    ['JavaScript', 'Python', 'HTML', 'CSS', 'SQL', 'DAX'].forEach(lang => {
        const option = document.createElement('option');
        option.value = lang.toLowerCase();
        option.textContent = lang;
        select.appendChild(option);
    });
    
    const pre = document.createElement('pre');
    pre.className = 'bg-gray-900 text-white p-4 rounded-lg';
    
    const code = document.createElement('code');
    code.contentEditable = true;
    code.className = 'block focus:outline-none';
    code.dataset.placeholder = 'Enter your code here...';
    
    pre.appendChild(code);
    wrapper.appendChild(pre);
    wrapper.appendChild(select);
    
    return wrapper;
}

function createQuoteBlock() {
    const blockquote = document.createElement('blockquote');
    blockquote.className = 'border-l-4 border-gray-300 pl-4 italic text-gray-700';
    blockquote.contentEditable = true;
    blockquote.dataset.placeholder = 'Enter a quote...';
    blockquote.dataset.type = 'quote';
    return blockquote;
}

function createVideoBlock() {
    const wrapper = document.createElement('div');
    wrapper.className = 'relative group';
    wrapper.dataset.type = 'video';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500';
    input.placeholder = 'Paste YouTube video URL here...';
    
    const preview = document.createElement('div');
    preview.className = 'mt-4 hidden';
    
    input.addEventListener('change', function() {
        const url = input.value;
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            const videoId = url.includes('youtube.com') ? 
                url.split('v=')[1].split('&')[0] : 
                url.split('youtu.be/')[1];
            
            preview.innerHTML = `
                <div class="relative pt-[56.25%]">
                    <iframe 
                        src="https://www.youtube.com/embed/${videoId}" 
                        class="absolute top-0 left-0 w-full h-full rounded-lg"
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen>
                    </iframe>
                </div>
            `;
            preview.classList.remove('hidden');
        }
    });
    
    wrapper.appendChild(input);
    wrapper.appendChild(preview);
    return wrapper;
}

function createTerminalBlock() {
    const wrapper = document.createElement('div');
    wrapper.className = 'relative bg-gray-900 rounded-lg overflow-hidden';
    wrapper.dataset.type = 'terminal';
    
    const header = document.createElement('div');
    header.className = 'flex items-center px-4 py-2 bg-gray-800';
    header.innerHTML = `
        <div class="flex space-x-2">
            <div class="w-3 h-3 rounded-full bg-red-500"></div>
            <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div class="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
    `;
    
    const content = document.createElement('div');
    content.className = 'p-4 font-mono text-sm text-white';
    content.contentEditable = true;
    content.dataset.placeholder = '$ Enter terminal commands...';
    
    wrapper.appendChild(header);
    wrapper.appendChild(content);
    return wrapper;
}

function createListBlock() {
    const wrapper = document.createElement('div');
    wrapper.className = 'relative';
    wrapper.dataset.type = 'list';

    const select = document.createElement('select');
    select.className = 'absolute top-2 right-2 text-sm bg-gray-100 text-gray-800 rounded px-2 py-1';
    ['Bulleted List', 'Numbered List', 'Checklist'].forEach(type => {
        const option = document.createElement('option');
        option.value = type.toLowerCase().replace(' ', '-');
        option.textContent = type;
        select.appendChild(option);
    });
    
    let listElement = document.createElement('ul');
    listElement.className = 'list-disc ml-6 space-y-2';
    listElement.contentEditable = true;
    listElement.dataset.placeholder = 'Type your list items...';
    
    // Create initial list item
    const li = document.createElement('li');
    li.textContent = 'List item';
    li.contentEditable = true;
    listElement.appendChild(li);
    
    // Handle list type changes
    select.addEventListener('change', function() {
        const newListElement = document.createElement(
            this.value === 'bulleted-list' ? 'ul' :
            this.value === 'numbered-list' ? 'ol' : 'ul'
        );
        
        // Set appropriate class based on list type
        newListElement.className = 
            this.value === 'bulleted-list' ? 'list-disc ml-6 space-y-2' :
            this.value === 'numbered-list' ? 'list-decimal ml-6 space-y-2' :
            'list-none ml-6 space-y-2';
            
        // For checklist type, convert list items to checkbox format
        if (this.value === 'checklist') {
            const items = Array.from(listElement.children);
            items.forEach(item => {
                const checkboxWrapper = document.createElement('div');
                checkboxWrapper.className = 'flex items-center gap-2';
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'form-checkbox h-4 w-4 text-blue-600';
                checkboxWrapper.appendChild(checkbox);
                const text = document.createElement('span');
                text.contentEditable = true;
                text.textContent = item.textContent;
                checkboxWrapper.appendChild(text);
                const li = document.createElement('li');
                li.appendChild(checkboxWrapper);
                newListElement.appendChild(li);
            });
        } else {
            // For regular lists, just transfer the content
            while (listElement.firstChild) {
                newListElement.appendChild(listElement.firstChild.cloneNode(true));
            }
        }
        
        newListElement.contentEditable = true;
        listElement.replaceWith(newListElement);
        listElement = newListElement;
        
        // Listen for Enter key to add new items
        listElement.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const newItem = document.createElement('li');
                if (select.value === 'checklist') {
                    const checkboxWrapper = document.createElement('div');
                    checkboxWrapper.className = 'flex items-center gap-2';
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.className = 'form-checkbox h-4 w-4 text-blue-600';
                    checkboxWrapper.appendChild(checkbox);
                    const text = document.createElement('span');
                    text.contentEditable = true;
                    checkboxWrapper.appendChild(text);
                    newItem.appendChild(checkboxWrapper);
                } else {
                    newItem.contentEditable = true;
                }
                listElement.appendChild(newItem);
                // Focus the new item
                const range = document.createRange();
                const sel = window.getSelection();
                range.selectNodeContents(select.value === 'checklist' ? newItem.querySelector('span') : newItem);
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);
            }
        });
    });

    // Initial Enter key handler
    listElement.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const newItem = document.createElement('li');
            if (select.value === 'checklist') {
                const checkboxWrapper = document.createElement('div');
                checkboxWrapper.className = 'flex items-center gap-2';
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'form-checkbox h-4 w-4 text-blue-600';
                checkboxWrapper.appendChild(checkbox);
                const text = document.createElement('span');
                text.contentEditable = true;
                checkboxWrapper.appendChild(text);
                newItem.appendChild(checkboxWrapper);
            } else {
                newItem.contentEditable = true;
            }
            listElement.appendChild(newItem);
            // Focus the new item
            const range = document.createRange();
            const sel = window.getSelection();
            range.selectNodeContents(select.value === 'checklist' ? newItem.querySelector('span') : newItem);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
        }
    });

    wrapper.appendChild(select);
    wrapper.appendChild(listElement);
    return wrapper;
}

function createDividerBlock() {
    const hr = document.createElement('hr');
    hr.className = 'my-8 border-t border-gray-300';
    hr.dataset.type = 'divider';
    return hr;
}

function collectBlockContent() {
    return Array.from(document.querySelectorAll('.block-container')).map(container => {
        const block = container.querySelector('[data-type]');
        if (!block) return null;

        const type = block.dataset.type;
        let content = '';
        let language = '';

        switch (type) {
            case 'text':
            case 'heading':
            case 'quote':
                content = block.innerText;
                break;
                
            case 'image':
                const img = block.querySelector('img');
                content = img ? img.src : '';
                break;
                
            case 'video':
                const iframe = block.querySelector('iframe');
                content = iframe ? iframe.src : block.querySelector('input').value;
                break;
                
            case 'code':
                content = block.querySelector('code').innerText;
                language = block.querySelector('select').value;
                break;
                
            case 'terminal':
                content = block.querySelector('[contenteditable]').innerText;
                break;

            case 'list':
                const listType = block.querySelector('select').value;
                const items = Array.from(block.querySelector('ul, ol').children).map(li => {
                    if (listType === 'checklist') {
                        const checkbox = li.querySelector('input[type="checkbox"]');
                        const text = li.querySelector('span').textContent;
                        return { checked: checkbox.checked, text };
                    }
                    return li.textContent;
                });
                content = JSON.stringify({ type: listType, items });
                break;
                
            case 'divider':
                content = 'hr';
                break;
        }

        if (!content || content.trim() === '') return null;

        return {
            type,
            content,
            ...(language && { language })
        };
    }).filter(block => block !== null);
}

function applyFormatting(format) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    
    switch (format) {
        case 'bold':
            document.execCommand('bold', false);
            break;
        case 'italic':
            document.execCommand('italic', false);
            break;
        case 'link':
            const url = prompt('Enter the URL:');
            if (url) {
                document.execCommand('createLink', false, url);
            }
            break;
        case 'h1':
        case 'h2':
        case 'h3':
            document.execCommand('formatBlock', false, format);
            break;
    }
}

async function saveDraft() {
    const titleInput = document.querySelector('input[placeholder="Your Article Title"]');
    if (!titleInput) return;

    const title = titleInput.value.trim();
    if (!title) {
        showNotification('Please enter a title for your article', 'error');
        return;
    }

    // Get HTML content from contenteditable editor
    const editorContent = document.getElementById('editor-content');
    const content = editorContent ? editorContent.innerHTML : '';

    if (!content.trim()) {
        showNotification('Please add some content to your article', 'error');
        return;
    }

    // Get featured image if it exists
    const featuredImg = document.querySelector('#featured-image-preview img');
    const featuredImage = featuredImg ? featuredImg.src : null;
    
    const draft = {
        title,
        content: content,
        featured_image: featuredImage,
        lastSaved: new Date().toISOString(),
        draft_id: localStorage.getItem('current-draft-id') || new Date().getTime().toString()
    };
    
    try {
        const response = await fetch('/api/save-draft', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(draft)
        });

        const result = await response.json();
        
        if (result.status === 'success') {
            localStorage.setItem('current-draft-id', result.draft_id);
            showNotification('Draft saved successfully', 'success');
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('Error saving draft:', error);
        showNotification('Error saving draft: ' + error.message, 'error');
        // Save to localStorage as backup
        localStorage.setItem('blog-draft-backup', JSON.stringify(draft));
    }
}

async function publishPost() {
    const titleInput = document.querySelector('input[placeholder="Your Article Title"]');
    if (!titleInput || !titleInput.value.trim()) {
        showNotification('Please enter a title for your article', 'error');
        return;
    }

    const descriptionInput = document.getElementById('post-description');
    if (!descriptionInput) {
        showNotification('Description field not found', 'error');
        return;
    }

    const title = titleInput.value.trim();
    const description = descriptionInput.value.trim();
    
    // Get HTML content from contenteditable editor
    const editorContent = document.getElementById('editor-content');
    const content = editorContent ? editorContent.innerHTML : '';
    
    const draft_id = localStorage.getItem('current-draft-id');
    
    // Validate required fields
    if (!title) {
        showNotification('Please enter a title for your article', 'error');
        return;
    }

    if (!description) {
        showNotification('Please enter a description for your article', 'error');
        descriptionInput.focus();
        return;
    }
    
    // Validate description length
    if (description.length < 50 || description.length > 200) {
        showNotification('Description should be between 50 and 200 characters', 'error');
        descriptionInput.focus();
        return;
    }

    if (!content.trim()) {
        showNotification('Please add some content to your article', 'error');
        return;
    }

    if (!draft_id) {
        showNotification('Please save your post as a draft first', 'error');
        return;
    }

    const featuredImg = document.querySelector('#featured-image-preview img');

    try {
        const response = await fetch('/api/publish', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                draft_id,
                title,
                description,
                content,
                featured_image: featuredImg ? featuredImg.src : null,
                date: new Date().toISOString()
            })
        });

        const result = await response.json();
        
        if (result.status === 'success') {
            showNotification('Post published successfully!', 'success');
            // Clear the editor and local storage
            clearEditor();
            localStorage.removeItem('current-draft-id');
            localStorage.removeItem('blog-draft-backup');
            // Redirect to the blog list after a short delay
            setTimeout(() => {
                window.location.href = '/blog';
            }, 1500);
        } else {
            throw new Error(result.message || 'Error publishing post');
        }
    } catch (error) {
        console.error('Error publishing post:', error);
        showNotification('Error publishing post: ' + error.message, 'error');
    }
}

function clearEditor() {
    // Clear title
    const titleInput = document.querySelector('input[placeholder="Your Article Title"]');
    if (titleInput) titleInput.value = '';
    
    // Clear description
    const descriptionInput = document.getElementById('post-description');
    if (descriptionInput) descriptionInput.value = '';
    
    // Clear featured image
    const featuredImagePreview = document.getElementById('featured-image-preview');
    const addFeaturedImageBtn = document.getElementById('add-featured-image');
    if (featuredImagePreview && addFeaturedImageBtn) {
        featuredImagePreview.classList.add('hidden');
        addFeaturedImageBtn.classList.remove('hidden');
        const img = featuredImagePreview.querySelector('img');
        if (img) img.src = '';
    }
    
    // Clear content editor
    const editorContent = document.getElementById('editor-content');
    if (editorContent) {
        editorContent.innerHTML = '<p><br></p>';
    }
}

function showNotification(message, type = 'info') {
    // Create notification element if it doesn't exist
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.className = 'fixed bottom-4 right-4 p-4 rounded-lg shadow-lg transform transition-transform duration-300 translate-y-full';
        document.body.appendChild(notification);
    }

    // Set notification style based on type
    const bgColor = type === 'success' ? 'bg-green-500' : 
                   type === 'error' ? 'bg-red-500' : 
                   'bg-blue-500';
    
    notification.className = `fixed bottom-4 right-4 p-4 rounded-lg shadow-lg text-white ${bgColor} transform transition-transform duration-300`;
    notification.textContent = message;

    // Show notification
    setTimeout(() => {
        notification.style.transform = 'translateY(0)';
    }, 100);

    // Hide notification after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateY(100%)';
    }, 3000);
}
