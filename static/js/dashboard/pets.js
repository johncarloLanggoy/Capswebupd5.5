// ── PET MANAGEMENT ──────────────────────────────────────────────────

import { fetchPets, createPet, updatePet, deletePetAPI, updatePetImage } from './services.js';
import { showToast, getLoggedInEmail } from './utils.js';

// ── Load My Pets ────────────────────────────────────────────────────
export async function loadMyPets() {
    const email = getLoggedInEmail();
    if (!email) return;
    
    const container = document.getElementById('myPetsContainer');
    
    try {
        const data = await fetchPets(email);
        
        if (data.success && data.pets && data.pets.length > 0) {
            document.getElementById('petCount').textContent = data.pets.length;
            
            const badge = document.getElementById('petBadge');
            if (badge) {
                badge.textContent = data.pets.length;
                badge.style.display = 'inline-block';
            }
            
            let petsHTML = '<div class="pets-grid">';
            data.pets.forEach(pet => {
                let statusClass = 'healthy';
                let statusText = '✅ Healthy';
                
                const hasRealAllergies = pet.allergies && 
                                        pet.allergies.trim() !== '' && 
                                        pet.allergies.trim().toLowerCase() !== 'none' &&
                                        pet.allergies.trim().toLowerCase() !== 'n/a';
                
                const hasRealMedicalHistory = pet.medical_history && 
                                             pet.medical_history.trim() !== '' && 
                                             pet.medical_history.trim().toLowerCase() !== 'none' &&
                                             pet.medical_history.trim().toLowerCase() !== 'n/a';
                
                if (hasRealAllergies) {
                    statusClass = 'critical';
                    statusText = '⚠️ Has Allergies';
                } else if (hasRealMedicalHistory) {
                    statusClass = 'warning';
                    statusText = '⚠️ Needs Attention';
                }
                
                const allergiesDisplay = pet.allergies && pet.allergies.trim() !== '' ? pet.allergies : 'None';
                const medicalHistoryDisplay = pet.medical_history && pet.medical_history.trim() !== '' ? pet.medical_history : 'None';
                
                const petType = pet.pet_type || 'Dog';
                const petIcon = petType === 'Cat' ? '🐈' : '🐕';
                const petTypeLabel = petType === 'Cat' ? 'Cat' : 'Dog';
                
                petsHTML += `
                    <div class="pet-card">
                        <div class="pet-avatar">
                            ${pet.pet_image ? 
                                `<img src="${pet.pet_image}" alt="${pet.name}" id="petImg-${pet.id}">` : 
                                `<span style="font-size: 60px;">${petIcon}</span>`
                            }
                            <button class="edit-image-btn" onclick="window.showEditPetImageModal(${pet.id}, '${pet.name}')" title="Change pet photo">
                                📷
                            </button>
                        </div>
                        <div class="pet-name">${pet.name} ${petIcon}</div>
                        <div class="pet-breed">${petTypeLabel} • ${pet.breed || 'Mixed Breed'} • ${pet.age || 'Unknown'} years</div>
                        <div class="pet-info">
                            <div><span class="label">🐾 Type:</span> ${petTypeLabel}</div>
                            <div><span class="label">⚥ Gender:</span> ${pet.gender || '—'}</div>
                            <div><span class="label">🎨 Color:</span> ${pet.color || '—'}</div>
                            <div><span class="label">⚖️ Weight:</span> ${pet.weight || '—'} kg</div>
                            <div><span class="label">⚠️ Allergies:</span> ${allergiesDisplay}</div>
                            <div><span class="label">📋 Medical History:</span> ${medicalHistoryDisplay}</div>
                            <div style="text-align: center; margin-top: 10px;">
                                <span class="pet-status ${statusClass}">${statusText}</span>
                            </div>
                            <div style="text-align: center; margin-top: 10px; display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">
                                <button onclick="window.showPetRecommendation(${pet.id})" 
                                        style="background: linear-gradient(135deg, #8b5cf6, #6d28d9); color: white; border: none; padding: 6px 14px; border-radius: 8px; cursor: pointer; font-size: 11px; font-weight: 600; transition: all 0.3s ease;">
                                    🤖 AI
                                </button>
                                <button onclick="window.showEditPetDetailsModal(${pet.id})" 
                                        style="background: #38bdf8; color: #0f172a; border: none; padding: 6px 14px; border-radius: 8px; cursor: pointer; font-size: 11px; font-weight: 600; transition: all 0.3s ease;">
                                    ✏️ Edit
                                </button>
                                <button onclick="window.deletePet(${pet.id})" 
                                        style="background: #ef4444; color: white; border: none; padding: 6px 14px; border-radius: 8px; cursor: pointer; font-size: 11px; font-weight: 600; transition: all 0.3s ease;">
                                    🗑️ Delete
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            });
            petsHTML += '</div>';
            container.innerHTML = petsHTML;
        } else {
            document.getElementById('petCount').textContent = '0';
            
            const badge = document.getElementById('petBadge');
            if (badge) badge.style.display = 'none';
            
            container.innerHTML = `
                <div class="no-pets-message">
                    <div class="icon">🐕</div>
                    <h3>No Pets Registered</h3>
                    <p>You don't have any pets registered yet. Click the <strong>"Add New Pet"</strong> button above to register your furry friend!</p>
                    <div class="info-box">
                        <p>📌 To register your pet:</p>
                        <p>1. Click the <span class="highlight">"Add New Pet"</span> button above</p>
                        <p>2. Fill in your pet's details</p>
                        <p>3. Click <span class="highlight">"Register Pet"</span> to save</p>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading pets:', error);
    }
}

// ── Submit New Pet ─────────────────────────────────────────────────
export async function submitNewPet(e) {
    e.preventDefault();
    
    const name = document.getElementById('addPetName').value.trim();
    const pet_type = document.getElementById('addPetType').value;
    const breed = document.getElementById('addPetBreed').value.trim();
    const age = document.getElementById('addPetAge').value;
    const gender = document.getElementById('addPetGender').value;
    const weight = document.getElementById('addPetWeight').value;
    const color = document.getElementById('addPetColor').value.trim();
    const allergies = document.getElementById('addPetAllergies').value.trim();
    const medical_history = document.getElementById('addPetMedicalHistory').value.trim();
    const imageInput = document.getElementById('addPetImageInput');
    
    if (!name) {
        showToast('Please enter your pet\'s name.', 'error');
        return;
    }
    
    const btn = document.getElementById('addPetSubmitBtn');
    btn.textContent = '⏳ Registering...';
    btn.disabled = true;
    
    try {
        let pet_image = '';
        if (imageInput.files && imageInput.files[0]) {
            const reader = new FileReader();
            pet_image = await new Promise((resolve) => {
                reader.onload = function(e) {
                    resolve(e.target.result);
                };
                reader.readAsDataURL(imageInput.files[0]);
            });
        }
        
        const data = await createPet({ 
            name, pet_type, breed, age, gender, weight, color, allergies, medical_history, pet_image 
        });
        
        if (data.success) {
            showToast('✅ Pet registered successfully!', 'success');
            closeAddPetModal();
            loadMyPets();
            const petCount = document.getElementById('petCount');
            if (petCount) {
                const current = parseInt(petCount.textContent) || 0;
                petCount.textContent = current + 1;
            }
        } else {
            showToast('❌ ' + (data.message || 'Error registering pet.'), 'error');
            btn.textContent = '💾 Register Pet';
            btn.disabled = false;
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Something went wrong. Please try again.', 'error');
        btn.textContent = '💾 Register Pet';
        btn.disabled = false;
    }
}

// ── Update Pet Details ─────────────────────────────────────────────
export async function updatePetDetails(e) {
    e.preventDefault();
    
    const petId = document.getElementById('editPetDetailsId').value;
    const name = document.getElementById('editPetDetailsName').value.trim();
    const pet_type = document.getElementById('editPetDetailsType').value;
    const breed = document.getElementById('editPetDetailsBreed').value.trim();
    const age = document.getElementById('editPetDetailsAge').value;
    const gender = document.getElementById('editPetDetailsGender').value;
    const weight = document.getElementById('editPetDetailsWeight').value;
    const color = document.getElementById('editPetDetailsColor').value.trim();
    const allergies = document.getElementById('editPetDetailsAllergies').value.trim();
    const medical_history = document.getElementById('editPetDetailsMedicalHistory').value.trim();
    
    if (!name) {
        showToast('Please enter your pet\'s name.', 'error');
        return;
    }
    
    const btn = document.getElementById('editPetDetailsSubmitBtn');
    btn.textContent = '⏳ Updating...';
    btn.disabled = true;
    
    try {
        const data = await updatePet(petId, { name, pet_type, breed, age, gender, weight, color, allergies, medical_history });
        
        if (data.success) {
            showToast('✅ Pet updated successfully!', 'success');
            closeEditPetDetailsModal();
            loadMyPets();
        } else {
            showToast('❌ ' + (data.message || 'Error updating pet.'), 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Something went wrong. Please try again.', 'error');
    }
    
    btn.textContent = '💾 Update Pet';
    btn.disabled = false;
}

// ── Delete Pet ─────────────────────────────────────────────────────
export async function deletePet(petId) {
    if (!confirm('Are you sure you want to delete this pet? This action cannot be undone.')) {
        return;
    }
    
    try {
        const data = await deletePetAPI(petId);
        if (data.success) {
            showToast('🗑️ Pet deleted successfully!', 'success');
            loadMyPets();
            const petCount = document.getElementById('petCount');
            if (petCount) {
                const current = parseInt(petCount.textContent) || 0;
                petCount.textContent = current > 0 ? current - 1 : 0;
            }
        } else {
            showToast('❌ ' + (data.message || 'Error deleting pet.'), 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Something went wrong. Please try again.', 'error');
    }
}

// ── Show Add Pet Modal ─────────────────────────────────────────────
export function showAddPetModal() {
    document.getElementById('addPetModal').style.display = 'flex';
    document.getElementById('addPetForm').reset();
    const preview = document.getElementById('addPetImagePreview');
    preview.innerHTML = `
        <span style="font-size: 36px; color: #64748b;">📷</span>
        <span style="font-size: 11px; color: #64748b; margin-top: 4px;">Tap to add photo</span>
    `;
    preview.style.border = '2px dashed #334155';
    document.getElementById('addPetSubmitBtn').disabled = false;
    document.getElementById('addPetSubmitBtn').textContent = '💾 Register Pet';
}

export function closeAddPetModal() {
    document.getElementById('addPetModal').style.display = 'none';
}

export function previewAddPetImage(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
        showToast('File is too large. Please upload an image under 5MB.', 'error');
        event.target.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('addPetImagePreview');
        preview.innerHTML = `<img src="${e.target.result}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
        preview.style.border = '2px solid #10b981';
    };
    reader.readAsDataURL(file);
}

// ── Show Edit Pet Details Modal ───────────────────────────────────
export async function showEditPetDetailsModal(petId) {
    const email = getLoggedInEmail();
    if (!email) return;
    
    try {
        const data = await fetchPets(email);
        if (data.success) {
            const pet = data.pets.find(p => p.id === petId);
            if (pet) {
                document.getElementById('editPetDetailsId').value = pet.id;
                document.getElementById('editPetDetailsName').value = pet.name || '';
                document.getElementById('editPetDetailsType').value = pet.pet_type || 'Dog';
                document.getElementById('editPetDetailsBreed').value = pet.breed || '';
                document.getElementById('editPetDetailsAge').value = pet.age || '';
                document.getElementById('editPetDetailsGender').value = pet.gender || '';
                document.getElementById('editPetDetailsWeight').value = pet.weight || '';
                document.getElementById('editPetDetailsColor').value = pet.color || '';
                document.getElementById('editPetDetailsAllergies').value = pet.allergies || '';
                document.getElementById('editPetDetailsMedicalHistory').value = pet.medical_history || '';
                
                document.getElementById('editPetDetailsModal').style.display = 'flex';
            }
        }
    } catch (error) {
        console.error('Error loading pet details:', error);
        showToast('Error loading pet details.', 'error');
    }
}

export function closeEditPetDetailsModal() {
    document.getElementById('editPetDetailsModal').style.display = 'none';
}

// ── Edit Pet Image Modal ──────────────────────────────────────────
let currentEditPetId = null;
let currentEditPetName = '';

export function showEditPetImageModal(petId, petName) {
    currentEditPetId = petId;
    currentEditPetName = petName;
    document.getElementById('editPetImageId').value = petId;
    document.getElementById('editPetNameDisplay').textContent = petName;
    document.getElementById('editPetImageModal').style.display = 'flex';
    
    document.getElementById('editPetImagePreview2').innerHTML = '<span style="color: #64748b; font-size: 14px; text-align: center;">No<br>Image</span>';
    document.getElementById('editPetImageInput').value = '';
    
    const petCards = document.querySelectorAll('.pet-card');
    for (let card of petCards) {
        const nameEl = card.querySelector('.pet-name');
        if (nameEl && nameEl.textContent.trim().startsWith(petName)) {
            const img = card.querySelector('.pet-avatar img');
            if (img) {
                document.getElementById('editPetImagePreview2').innerHTML = `<img src="${img.src}" style="width: 100%; height: 100%; object-fit: cover;">`;
            }
            break;
        }
    }
    
    document.getElementById('updatePhotoBtn').innerHTML = '💾 Update Photo';
    document.getElementById('updatePhotoBtn').disabled = false;
}

export function closeEditPetImageModal() {
    document.getElementById('editPetImageModal').style.display = 'none';
}

export function previewEditPetImage2(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
        showToast('File is too large. Please upload an image under 5MB.', 'error');
        event.target.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('editPetImagePreview2');
        preview.innerHTML = `<img src="${e.target.result}" style="width: 100%; height: 100%; object-fit: cover;">`;
    };
    reader.readAsDataURL(file);
}

export async function submitPetImageUpdate(e) {
    e.preventDefault();
    
    const petId = document.getElementById('editPetImageId').value;
    const imageInput = document.getElementById('editPetImageInput');
    const btn = document.getElementById('updatePhotoBtn');
    
    if (!imageInput.files || !imageInput.files[0]) {
        showToast('Please select a photo to upload.', 'error');
        return;
    }
    
    if (imageInput.files[0].size > 5 * 1024 * 1024) {
        showToast('File is too large. Please upload an image under 5MB.', 'error');
        return;
    }
    
    btn.innerHTML = '⏳ Uploading...';
    btn.disabled = true;
    
    const reader = new FileReader();
    reader.onload = async function(event) {
        try {
            const data = await updatePetImage(petId, event.target.result);
            if (data.success) {
                showToast('✅ Pet photo updated successfully!', 'success');
                closeEditPetImageModal();
                loadMyPets();
            } else {
                showToast('❌ ' + (data.message || 'Error updating photo.'), 'error');
                btn.innerHTML = '💾 Update Photo';
                btn.disabled = false;
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('Something went wrong. Please try again.', 'error');
            btn.innerHTML = '💾 Update Photo';
            btn.disabled = false;
        }
    };
    reader.readAsDataURL(imageInput.files[0]);
}

// ── AI RECOMMENDATION FUNCTIONS ──────────────────────────────────────

export async function showPetRecommendation(petId) {
    try {
        // Show loading modal
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.id = 'recommendationLoadingModal';
        overlay.innerHTML = `
            <div class="modal-popup" style="max-width: 500px; text-align: center;">
                <div style="padding: 20px;">
                    <div style="font-size: 60px; margin-bottom: 20px;">🤖</div>
                    <h3 style="color: #38bdf8; font-size: 24px; margin-bottom: 15px;">Generating AI Recommendations...</h3>
                    <p style="color: #94a3b8; font-size: 14px; margin-bottom: 20px;">Analyzing your pet's health data</p>
                    <div style="display: flex; justify-content: center; padding: 10px;">
                        <div style="width: 50px; height: 50px; border: 4px solid #334155; border-top-color: #38bdf8; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
                    </div>
                    <p style="color: #64748b; font-size: 12px; margin-top: 15px;">This may take a moment...</p>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        
        // Add spin animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
        
        // Fetch recommendation
        const res = await fetch(`/api/ml/recommendation/${petId}`);
        const data = await res.json();
        
        // Remove loading modal
        const loadingModal = document.getElementById('recommendationLoadingModal');
        if (loadingModal) loadingModal.remove();
        
        if (data.success && data.recommendation) {
            const rec = data.recommendation;
            const recommendations = rec.recommendations || [];
            
            // Pet info section
            const petInfo = rec.pet_info || {};
            
            let recHTML = '';
            
            // Sort recommendations by priority
            const priorityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
            const sortedRecs = [...recommendations].sort((a, b) => {
                return (priorityOrder[a.priority] || 4) - (priorityOrder[b.priority] || 4);
            });
            
            sortedRecs.forEach(r => {
                const priorityColors = {
                    'critical': '#ef4444',
                    'high': '#f59e0b',
                    'medium': '#38bdf8',
                    'low': '#10b981'
                };
                const color = priorityColors[r.priority] || '#94a3b8';
                
                const priorityLabels = {
                    'critical': '🚨 CRITICAL',
                    'high': '⚠️ HIGH',
                    'medium': '📌 MEDIUM',
                    'low': '✅ LOW'
                };
                
                recHTML += `
                    <div style="background: #0f172a; border-radius: 12px; padding: 14px 18px; margin-bottom: 12px; border-left: 4px solid ${color};">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; flex-wrap: wrap; gap: 4px;">
                            <span style="font-weight: 600; color: #38bdf8; text-transform: uppercase; font-size: 13px;">${r.type.replace('_', ' ').toUpperCase()}</span>
                            <span style="font-size: 10px; color: ${color}; font-weight: 700; background: rgba(0,0,0,0.3); padding: 2px 10px; border-radius: 10px;">${priorityLabels[r.priority] || r.priority.toUpperCase()}</span>
                        </div>
                        <p style="color: #e2e8f0; font-size: 14px; margin: 4px 0 8px 0; line-height: 1.5;">${r.text}</p>
                        <div style="display: flex; flex-wrap: wrap; gap: 10px; font-size: 12px;">
                            ${r.suggested_date ? `<span style="color: #94a3b8;">📅 <span style="color: #e2e8f0;">${r.suggested_date}</span></span>` : ''}
                            ${r.suggested_interval ? `<span style="color: #94a3b8;">⏱️ <span style="color: #e2e8f0;">${r.suggested_interval}</span></span>` : ''}
                            ${r.suggested_plan ? `<span style="color: #94a3b8;">📋 <span style="color: #e2e8f0;">${r.suggested_plan}</span></span>` : ''}
                            ${r.action ? `<span style="color: #94a3b8;">🎯 <span style="color: #38bdf8;">${r.action}</span></span>` : ''}
                        </div>
                    </div>
                `;
            });
            
            if (recHTML === '') {
                recHTML = `
                    <div style="text-align: center; padding: 30px; background: #0f172a; border-radius: 12px;">
                        <div style="font-size: 48px; margin-bottom: 10px;">🐾</div>
                        <p style="color: #94a3b8; font-size: 16px;">No specific recommendations at this time.</p>
                        <p style="color: #64748b; font-size: 13px;">Your pet appears to be in good health! 🎉</p>
                    </div>
                `;
            }
            
            // Calculate risk level display
            const riskScore = rec.health_risk_score || 0;
            let riskLevel = '🟢 Low';
            let riskColor = '#10b981';
            if (riskScore >= 7) {
                riskLevel = '🔴 High';
                riskColor = '#ef4444';
            } else if (riskScore >= 4) {
                riskLevel = '🟡 Moderate';
                riskColor = '#f59e0b';
            }
            
            const careLevelDisplay = rec.care_level.replace('_', ' ').toUpperCase();
            
            // Show result modal
            const resultOverlay = document.createElement('div');
            resultOverlay.className = 'modal-overlay';
            resultOverlay.id = 'recommendationResultModal';
            resultOverlay.style.zIndex = '3000';
            resultOverlay.innerHTML = `
                <div class="modal-popup" style="max-width: 650px; max-height: 90vh; overflow-y: auto;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
                        <div>
                            <h3 style="color: #38bdf8; font-size: 24px; margin: 0;">🤖 AI Care Recommendations</h3>
                            <p style="color: #94a3b8; font-size: 13px; margin: 5px 0 0;">Personalized recommendations for your pet</p>
                        </div>
                        <button onclick="window.closeRecommendationModal()" 
                                style="background: transparent; border: none; color: #94a3b8; font-size: 28px; cursor: pointer; padding: 0 10px; transition: 0.3s;"
                                onmouseover="this.style.color='#ef4444'"
                                onmouseout="this.style.color='#94a3b8'">
                            ✕
                        </button>
                    </div>
                    
                    <!-- Pet Summary -->
                    <div style="background: #0f172a; border-radius: 12px; padding: 16px 20px; margin-bottom: 20px; border: 1px solid #334155;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px;">
                            <div>
                                <div style="color: #64748b; font-size: 11px; text-transform: uppercase;">Breed</div>
                                <div style="color: #e2e8f0; font-size: 15px; font-weight: 500;">${petInfo.breed || 'Unknown'}</div>
                            </div>
                            <div>
                                <div style="color: #64748b; font-size: 11px; text-transform: uppercase;">Age</div>
                                <div style="color: #e2e8f0; font-size: 15px; font-weight: 500;">${petInfo.age || '?'} years</div>
                            </div>
                            <div>
                                <div style="color: #64748b; font-size: 11px; text-transform: uppercase;">Health Risk</div>
                                <div style="color: ${riskColor}; font-size: 15px; font-weight: 600;">${riskLevel}</div>
                            </div>
                            <div>
                                <div style="color: #64748b; font-size: 11px; text-transform: uppercase;">Care Level</div>
                                <div style="color: #38bdf8; font-size: 15px; font-weight: 600;">${careLevelDisplay}</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Recommendations -->
                    <div style="max-height: 400px; overflow-y: auto; padding-right: 5px;">
                        ${recHTML}
                    </div>
                    
                    <!-- Footer Actions -->
                    <div style="margin-top: 20px; display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; border-top: 1px solid #1e293b; padding-top: 20px;">
                        <button onclick="window.closeRecommendationModal()" 
                                style="background: #334155; color: white; border: none; padding: 12px 30px; border-radius: 12px; font-weight: 600; cursor: pointer; transition: 0.3s;"
                                onmouseover="this.style.background='#475569'"
                                onmouseout="this.style.background='#334155'">
                            Close
                        </button>
                        <button onclick="window.bookFromRecommendation()" 
                                style="background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; padding: 12px 30px; border-radius: 12px; font-weight: 600; cursor: pointer; transition: 0.3s;"
                                onmouseover="this.style.transform='scale(1.05)'"
                                onmouseout="this.style.transform='scale(1)'">
                            📅 Book Appointment
                        </button>
                        <button onclick="window.viewPetMedical(${petId})" 
                                style="background: #38bdf8; color: #0f172a; border: none; padding: 12px 30px; border-radius: 12px; font-weight: 600; cursor: pointer; transition: 0.3s;"
                                onmouseover="this.style.transform='scale(1.05)'"
                                onmouseout="this.style.transform='scale(1)'">
                            📋 View Records
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(resultOverlay);
            
        } else {
            showToast('❌ ' + (data.message || 'Could not generate recommendation.'), 'error');
        }
    } catch (error) {
        console.error('Error getting recommendation:', error);
        // Remove loading modal if exists
        const loadingModal = document.getElementById('recommendationLoadingModal');
        if (loadingModal) loadingModal.remove();
        showToast('Something went wrong. Please try again.', 'error');
    }
}

function closeRecommendationModal() {
    const modal = document.getElementById('recommendationResultModal');
    if (modal) modal.remove();
}

function bookFromRecommendation() {
    closeRecommendationModal();
    if (typeof window.showBookAppointmentModal === 'function') {
        window.showBookAppointmentModal();
    } else if (typeof showBookAppointmentModal === 'function') {
        showBookAppointmentModal();
    } else {
        showToast('Please go to Appointments tab to book.', 'info');
        if (typeof window.switchSection === 'function') {
            window.switchSection('appointments');
        }
    }
}

function viewPetMedical(petId) {
    closeRecommendationModal();
    const role = localStorage.getItem('role') || sessionStorage.getItem('role') || 'user';
    if (role === 'vet' || role === 'admin' || role === 'staff') {
        window.location.href = '/vet';
    } else {
        showToast('Medical records can be viewed by clinic staff.', 'info');
    }
}

// ── Make functions globally available ──────────────────────────────
window.loadMyPets = loadMyPets;
window.showAddPetModal = showAddPetModal;
window.closeAddPetModal = closeAddPetModal;
window.submitNewPet = submitNewPet;
window.previewAddPetImage = previewAddPetImage;
window.showEditPetDetailsModal = showEditPetDetailsModal;
window.closeEditPetDetailsModal = closeEditPetDetailsModal;
window.updatePetDetails = updatePetDetails;
window.deletePet = deletePet;
window.showEditPetImageModal = showEditPetImageModal;
window.closeEditPetImageModal = closeEditPetImageModal;
window.submitPetImageUpdate = submitPetImageUpdate;
window.previewEditPetImage2 = previewEditPetImage2;

// ── AI Functions ──────────────────────────────────────────────────────
window.showPetRecommendation = showPetRecommendation;
window.closeRecommendationModal = closeRecommendationModal;
window.bookFromRecommendation = bookFromRecommendation;
window.viewPetMedical = viewPetMedical;