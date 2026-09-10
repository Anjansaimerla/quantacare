const getApiBaseUrl = () => {
    let url = window.API_BASE_URL || localStorage.getItem('QUANTACARE_API_URL') || '';
    if (!url && window.location.hostname.includes('vercel.app')) {
        url = 'https://quantacare.onrender.com';
    }
    url = url.trim().replace(/\/$/, '');
    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }
    if (window.location.protocol === 'https:' && url.startsWith('http://')) {
        url = url.replace('http://', 'https://');
    }
    return url;
};

document.addEventListener('DOMContentLoaded', () => {
    // Sync API Base URL label on load
    const apiLabel = document.getElementById('disp_api_url_label');
    const btnChangeApi = document.getElementById('btn_change_api_url');
    const updateApiLabel = () => {
        const url = getApiBaseUrl();
        if (apiLabel) {
            apiLabel.innerText = url ? (url.replace('https://', '').replace('http://', '')) : 'Local (Relative)';
        }
    };
    updateApiLabel();

    if (btnChangeApi) {
        btnChangeApi.addEventListener('click', () => {
            const current = getApiBaseUrl() || 'https://quantacare-production.up.railway.app';
            const updated = prompt('Set Live Backend API URL (Railway / Render):\n(e.g. https://quantacare-production.up.railway.app)', current);
            if (updated !== null) {
                let cleaned = updated.trim().replace(/\/$/, '');
                if (cleaned && !cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
                    cleaned = 'https://' + cleaned;
                }
                if (window.location.protocol === 'https:' && cleaned.startsWith('http://')) {
                    cleaned = cleaned.replace('http://', 'https://');
                }
                if (cleaned) {
                    localStorage.setItem('QUANTACARE_API_URL', cleaned);
                } else {
                    localStorage.removeItem('QUANTACARE_API_URL');
                }
                updateApiLabel();
                alert(`Backend API URL set to:\n${getApiBaseUrl() || 'Same Origin (Local)'}`);
            }
        });
    }
    // 0. Ensure inputs and output cards start completely empty/awaiting input on fresh page load/refresh
    const clearFormInputs = () => {
        ['val_age', 'val_sys_bp', 'val_dia_bp', 'val_fbs', 'val_chol', 'val_bmi', 'val_patient_id', 'val_notes',
         'scan_age', 'scan_sys_bp', 'scan_dia_bp', 'scan_fbs', 'scan_chol', 'scan_bmi', 'scan_patient_id'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
    };

    const resetOutputCardsToInitialState = () => {
        const arcEl = document.getElementById('svg_risk_arc');
        if (arcEl) arcEl.style.strokeDashoffset = 125.66;

        const scoreValEl = document.getElementById('disp_risk_score');
        if (scoreValEl) scoreValEl.innerText = '--%';

        const sealEl = document.getElementById('wax_seal_badge');
        if (sealEl) {
            sealEl.innerText = 'AWAITING INPUT';
            sealEl.className = 'risk-pill-badge pill-neutral';
        }

        const diseaseNameEl = document.getElementById('disp_disease_name');
        if (diseaseNameEl) diseaseNameEl.innerText = 'Awaiting Clinical Evaluation';

        const statDiseaseNameEl = document.getElementById('disp_stat_disease_name');
        if (statDiseaseNameEl) statDiseaseNameEl.innerText = 'Awaiting Evaluation';

        const conditionDescEl = document.getElementById('disp_condition_desc');
        if (conditionDescEl) conditionDescEl.innerText = 'Please enter patient vitals or upload a diagnostic scan to run quantum evaluation.';

        const activeDomainEl = document.getElementById('disp_active_domain_label');
        if (activeDomainEl) activeDomainEl.innerText = 'Awaiting Intake';

        const confEl = document.getElementById('disp_confidence');
        if (confEl) confEl.innerText = '--% Confidence';

        const factorsContainer = document.getElementById('disp_risk_factors_container');
        if (factorsContainer) factorsContainer.innerHTML = '<span style="font-size: 0.8rem; color: var(--text-muted);">ℹ️ No risk factors evaluated yet</span>';

        const qubitContainer = document.getElementById('qubit_telemetry_container');
        if (qubitContainer) {
            const featureLabels = ['Age', 'Systolic BP', 'Diastolic BP', 'Glucose', 'Cholesterol', 'BMI'];
            let html = '';
            featureLabels.forEach(lbl => {
                html += `
                    <div class="biomarker-card">
                        <div class="biomarker-title">${lbl}</div>
                        <div class="biomarker-val" style="color: var(--text-muted);">--</div>
                        <div style="color: var(--text-muted); font-size: 0.7rem; margin-top: 2px;">VQC Index: --%</div>
                    </div>
                `;
            });
            qubitContainer.innerHTML = html;
        }

        const pineconeContainer = document.getElementById('pinecone_matches_container');
        if (pineconeContainer) {
            pineconeContainer.innerHTML = '<div class="cases-placeholder">Awaiting patient evaluation to retrieve matching evidence-based clinical guidelines.</div>';
        }

        const reportContainer = document.getElementById('report_container');
        if (reportContainer) {
            reportContainer.innerText = `================================================================================
QUANTACARE CLINICAL AI DIAGNOSTIC ASSESSMENT LEDGER
================================================================================
Status: Awaiting Patient Intake & Diagnostic Evaluation
--------------------------------------------------------------------------------
No active patient record loaded. Please enter physiological vitals or upload 
a diagnostic image scan to initiate quantum-assisted evaluation.
================================================================================`;
        }

        const fusionModeBadge = document.getElementById('disp_fusion_mode');
        if (fusionModeBadge) fusionModeBadge.innerText = 'Awaiting Diagnostic Stream';

        const imageStatusEl = document.getElementById('disp_image_status');
        if (imageStatusEl) imageStatusEl.innerText = 'No Scan Ingested';

        const previewBox = document.getElementById('preview_box');
        if (previewBox) previewBox.style.display = 'none';

        const fileInput = document.getElementById('scan_file_input');
        if (fileInput) fileInput.value = '';

        highlightDomainPill(null);
        clearAnalyticsCharts();
    };

    // --- Chart.js Clinical Analytics Engine ---
    let vitalsLineChart = null;
    let biomarkerRadarChart = null;

    const clearAnalyticsCharts = () => {
        if (vitalsLineChart) {
            vitalsLineChart.data.datasets[0].data = [null, null, null, null, null, null];
            vitalsLineChart.data.datasets[1].data = [null, null, null, null, null, null];
            vitalsLineChart.update();
        }

        if (biomarkerRadarChart) {
            biomarkerRadarChart.data.datasets[0].data = [null, null, null, null, null, null];
            biomarkerRadarChart.update();
        }
    };

    const initAnalyticsCharts = () => {
        const lineCtx = document.getElementById('vitals_line_chart')?.getContext('2d');
        const radarCtx = document.getElementById('biomarker_radar_chart')?.getContext('2d');

        if (lineCtx && typeof Chart !== 'undefined') {
            vitalsLineChart = new Chart(lineCtx, {
                type: 'line',
                data: {
                    labels: ['Age', 'Sys BP', 'Dia BP', 'Glucose', 'Chol', 'BMI'],
                    datasets: [
                        {
                            label: 'Patient Normalized Spectrum',
                            data: [null, null, null, null, null, null],
                            borderColor: '#0284c7',
                            backgroundColor: 'rgba(2, 132, 199, 0.12)',
                            fill: true,
                            tension: 0.4,
                            borderWidth: 3,
                            pointBackgroundColor: '#0284c7',
                            pointRadius: 5
                        },
                        {
                            label: 'Clinical Optimal Baseline',
                            data: [null, null, null, null, null, null],
                            borderColor: '#059669',
                            borderDash: [5, 5],
                            borderWidth: 2,
                            pointRadius: 0,
                            fill: false
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { min: 0, max: 1, grid: { color: '#f1f5f9' } },
                        x: { grid: { display: false } }
                    },
                    plugins: { legend: { position: 'top', labels: { font: { family: 'Plus Jakarta Sans', size: 11, weight: '700' } } } }
                }
            });
        }

        if (radarCtx && typeof Chart !== 'undefined') {
            biomarkerRadarChart = new Chart(radarCtx, {
                type: 'radar',
                data: {
                    labels: ['Age', 'Sys BP', 'Dia BP', 'Glucose', 'Chol', 'BMI'],
                    datasets: [
                        {
                            label: '6-Qubit Vector State',
                            data: [null, null, null, null, null, null],
                            borderColor: '#0d9488',
                            backgroundColor: 'rgba(13, 148, 136, 0.18)',
                            borderWidth: 2,
                            pointBackgroundColor: '#0d9488',
                            pointRadius: 4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        r: {
                            angleLines: { color: '#e2e8f0' },
                            grid: { color: '#e2e8f0' },
                            suggestedMin: 0,
                            suggestedMax: 1,
                            ticks: { display: false }
                        }
                    },
                    plugins: { legend: { position: 'top', labels: { font: { family: 'Plus Jakarta Sans', size: 11, weight: '700' } } } }
                }
            });
        }
    };

    const updateAnalyticsCharts = (features) => {
        if (!features || features.length < 6 || features.every(v => v === null || v === 0)) {
            clearAnalyticsCharts();
            return;
        }

        if (vitalsLineChart) {
            vitalsLineChart.data.datasets[0].data = features;
            vitalsLineChart.data.datasets[1].data = [0.4, 0.33, 0.36, 0.14, 0.25, 0.29];
            vitalsLineChart.update();
        }

        if (biomarkerRadarChart) {
            biomarkerRadarChart.data.datasets[0].data = features;
            biomarkerRadarChart.update();
        }
    };

    const updateAnalyticsChartsFromInputs = () => {
        const getVal = (id1, id2) => parseFloat(document.getElementById(id1)?.value || document.getElementById(id2)?.value) || 0;
        const age = getVal('val_age', 'scan_age');
        const sys = getVal('val_sys_bp', 'scan_sys_bp');
        const dia = getVal('val_dia_bp', 'scan_dia_bp');
        const fbs = getVal('val_fbs', 'scan_fbs');
        const chol = getVal('val_chol', 'scan_chol');
        const bmi = getVal('val_bmi', 'scan_bmi');

        if (!age && !sys && !dia && !fbs && !chol && !bmi) {
            clearAnalyticsCharts();
            return;
        }

        const normAge = Math.min(Math.max((age - 1) / 119, 0), 1);
        const normSys = Math.min(Math.max((sys - 60) / 180, 0), 1);
        const normDia = Math.min(Math.max((dia - 40) / 110, 0), 1);
        const normFbs = Math.min(Math.max((fbs - 50) / 350, 0), 1);
        const normChol = Math.min(Math.max((chol - 100) / 400, 0), 1);
        const normBmi = Math.min(Math.max((bmi - 10) / 50, 0), 1);

        updateAnalyticsCharts([normAge, normSys, normDia, normFbs, normChol, normBmi]);
    };
    window.updateAnalyticsChartsFromInputs = updateAnalyticsChartsFromInputs;

    initAnalyticsCharts();

function highlightDomainPill(targetString) {
    const specialtyBtns = document.querySelectorAll('.specialty-btn');
    specialtyBtns.forEach(b => b.classList.remove('active'));

    if (!targetString) return;

    const lowerTarget = targetString.toLowerCase();
    const domainMap = {
        cardiology: ['cardiology', 'cardiovascular', 'cardio', 'heart', 'cvd'],
        neurology: ['neurology', 'neuro', 'brain', 'head ct'],
        orthopedics: ['orthopedics', 'skeletal', 'bone', 'fracture'],
        pulmonology: ['pulmonology', 'thoracic', 'respiratory', 'lung', 'chest'],
        endocrinology: ['endocrinology', 'metabolic', 'diabetes', 'endocrine'],
        nephrology: ['nephrology', 'renal', 'kidney', 'glomerular'],
        oncology: ['oncology', 'tissue biomarker', 'pathology', 'cellular']
    };

    for (const btn of specialtyBtns) {
        const domainKey = btn.getAttribute('data-domain');
        const keywords = domainMap[domainKey] || [domainKey];
        if (keywords.some(kw => lowerTarget.includes(kw))) {
            btn.classList.add('active');
            break;
        }
    }
}
window.highlightDomainPill = highlightDomainPill;

    // Run clean state reset on load / refresh
    clearFormInputs();
    resetOutputCardsToInitialState();
    updateStoredRecordsCount();

    // Reset / Refresh Workspace Button
    const btnResetWorkspace = document.getElementById('btn_reset_workspace');
    if (btnResetWorkspace) {
        btnResetWorkspace.addEventListener('click', () => {
            clearFormInputs();
            resetOutputCardsToInitialState();
        });
    }

    // 2-Way Realtime Synchronization between Manual Vitals and Scan Vitals
    const syncPair = (id1, id2) => {
        const el1 = document.getElementById(id1);
        const el2 = document.getElementById(id2);
        if (el1 && el2) {
            el1.addEventListener('input', () => { el2.value = el1.value; });
            el2.addEventListener('input', () => { el1.value = el2.value; });
        }
    };
    syncPair('val_patient_id', 'scan_patient_id');
    syncPair('val_age', 'scan_age');
    syncPair('val_sys_bp', 'scan_sys_bp');
    syncPair('val_dia_bp', 'scan_dia_bp');
    syncPair('val_fbs', 'scan_fbs');
    syncPair('val_chol', 'scan_chol');
    syncPair('val_bmi', 'scan_bmi');

    // 1b. Stored Patient Records Drawer Modal Listeners
    const btnHistoryToggle = document.getElementById('btn_history_toggle');
    const btnCloseHistory = document.getElementById('btn_close_history');
    const btnClearHistory = document.getElementById('btn_clear_history');
    const historyModal = document.getElementById('history_modal');
    const historySearchInput = document.getElementById('history_search_input');

    if (btnHistoryToggle && historyModal) {
        btnHistoryToggle.addEventListener('click', () => {
            historyModal.style.display = 'flex';
            renderStoredRecordsList();
        });
    }

    if (btnCloseHistory && historyModal) {
        btnCloseHistory.addEventListener('click', () => {
            historyModal.style.display = 'none';
        });
    }

    if (btnClearHistory) {
        btnClearHistory.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all stored patient records from local history?')) {
                localStorage.removeItem('quantacare_patient_records');
                renderStoredRecordsList();
                updateStoredRecordsCount();
            }
        });
    }

    if (historySearchInput) {
        historySearchInput.addEventListener('input', () => {
            renderStoredRecordsList();
        });
    }

    // Global Top Search Input Handler (Live Dropdown + Enter key search, NO auto-scroll on typing)
    const globalSearchInput = document.getElementById('global_search_input');
    const globalSearchDropdown = document.getElementById('global_search_dropdown');
    
    if (globalSearchInput && globalSearchDropdown) {
        const renderSearchResultsDropdown = () => {
            const query = globalSearchInput.value.trim().toLowerCase();
            if (!query) {
                globalSearchDropdown.style.display = 'none';
                globalSearchDropdown.innerHTML = '';
                return;
            }

            let history = [];
            try {
                history = JSON.parse(localStorage.getItem('quantacare_patient_records') || '[]');
            } catch (e) { history = []; }

            const matches = [];
            history.forEach((rec, idx) => {
                const matchId = rec.id && rec.id.toLowerCase().includes(query);
                const matchTarget = rec.target && rec.target.toLowerCase().includes(query);
                const matchCondition = rec.condition && rec.condition.toLowerCase().includes(query);
                const matchTier = rec.risk_tier && rec.risk_tier.toLowerCase().includes(query);

                if (matchId || matchTarget || matchCondition || matchTier) {
                    matches.push({ rec, idx });
                }
            });

            if (matches.length === 0) {
                globalSearchDropdown.innerHTML = `
                    <div style="padding: 14px; text-align: center; color: #64748b; font-size: 0.8rem;">
                        No matching patient records in history ledger.<br>
                        <span style="color: #0284c7; font-weight: 700; display: inline-block; margin-top: 4px;">Press Enter to search / set Patient ID tag</span>
                    </div>
                `;
                globalSearchDropdown.style.display = 'block';
                return;
            }

            let html = '';
            matches.slice(0, 8).forEach(({ rec, idx }) => {
                let tierClass = (rec.risk_tier || '').includes('LOW') ? 'pill-low' : ((rec.risk_tier || '').includes('MODERATE') ? 'pill-moderate' : 'pill-high');
                const hasScanDoc = (rec.scan_file_info && rec.scan_file_info.has_scan) || (rec.data && rec.data.has_image_input);
                const docIcon = hasScanDoc ? ' 🩻' : '';

                html += `
                    <div class="search-dropdown-item" data-index="${idx}">
                        <div class="search-dropdown-info">
                            <div style="font-size: 0.7rem; color: #64748b;">⏱️ ${rec.date || ''} • 🏷️ ${rec.id}${docIcon}</div>
                            <div class="search-dropdown-title">${rec.target || 'Clinical Diagnostic Assessment'}</div>
                            <div class="search-dropdown-sub">${rec.condition || 'Evaluation Record'}</div>
                        </div>
                        <div>
                            <span class="risk-pill-badge ${tierClass}" style="font-size: 0.68rem; padding: 2px 8px;">${rec.risk_tier || 'EVALUATED'}</span>
                            <button type="button" class="btn-load-record" style="font-size: 0.72rem; padding: 4px 10px; margin-left: 6px;">Load</button>
                        </div>
                    </div>
                `;
            });

            globalSearchDropdown.innerHTML = html;
            globalSearchDropdown.style.display = 'block';

            // Bind click listeners for dropdown results
            globalSearchDropdown.querySelectorAll('.search-dropdown-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    const idx = parseInt(item.getAttribute('data-index'), 10);
                    if (!isNaN(idx)) {
                        window.loadHistoryRecord(idx);
                        globalSearchDropdown.style.display = 'none';
                    }
                });
            });
        };

        // Live input updates dropdown list without scrolling away
        globalSearchInput.addEventListener('input', () => {
            renderSearchResultsDropdown();
        });

        globalSearchInput.addEventListener('focus', () => {
            if (globalSearchInput.value.trim()) {
                renderSearchResultsDropdown();
            }
        });

        // Enter Key listener for explicit search submission & smooth scroll
        globalSearchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const query = globalSearchInput.value.trim().toLowerCase();
                globalSearchDropdown.style.display = 'none';

                if (!query) return;

                let history = [];
                try {
                    history = JSON.parse(localStorage.getItem('quantacare_patient_records') || '[]');
                } catch (err) { history = []; }

                const matchIdx = history.findIndex(rec =>
                    rec.id.toLowerCase() === query ||
                    rec.id.toLowerCase().includes(query) ||
                    (rec.target && rec.target.toLowerCase().includes(query)) ||
                    (rec.condition && rec.condition.toLowerCase().includes(query))
                );

                if (matchIdx !== -1) {
                    window.loadHistoryRecord(matchIdx);
                } else {
                    // Set Patient ID in intake inputs and scroll smoothly to workspace
                    ['val_patient_id', 'scan_patient_id'].forEach(id => {
                        const el = document.getElementById(id);
                        if (el) el.value = globalSearchInput.value.trim();
                    });
                    const intakeEl = document.getElementById('panel_manual_entry') || document.querySelector('.dashboard-grid');
                    if (intakeEl) intakeEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        });

        // Close dropdown when clicking outside search bar
        document.addEventListener('click', (e) => {
            const searchBar = document.querySelector('.search-bar');
            if (searchBar && !searchBar.contains(e.target)) {
                globalSearchDropdown.style.display = 'none';
            }
        });
    }

    // 2. Clinician Quick Guide Toggle
    const btnGuideToggle = document.getElementById('btn_guide_toggle');
    const guideBox = document.getElementById('guide_box');
    if (btnGuideToggle && guideBox) {
        btnGuideToggle.addEventListener('click', () => {
            const isVisible = guideBox.style.display !== 'none';
            guideBox.style.display = isVisible ? 'none' : 'block';
            btnGuideToggle.innerText = isVisible ? '💡 Clinician Quick Guide' : '✖ Close Guide';
        });
    }

    // 3. Sample Cohort Preset Buttons
    const btnPresetNormal = document.getElementById('preset_normal');
    const btnPresetModerate = document.getElementById('preset_moderate');
    const btnPresetHigh = document.getElementById('preset_high');

    const setInputValues = (vitals) => {
        ['val_age', 'scan_age'].forEach(id => { const el = document.getElementById(id); if (el) el.value = vitals.age; });
        ['val_sys_bp', 'scan_sys_bp'].forEach(id => { const el = document.getElementById(id); if (el) el.value = vitals.sys; });
        ['val_dia_bp', 'scan_dia_bp'].forEach(id => { const el = document.getElementById(id); if (el) el.value = vitals.dia; });
        ['val_fbs', 'scan_fbs'].forEach(id => { const el = document.getElementById(id); if (el) el.value = vitals.fbs; });
        ['val_chol', 'scan_chol'].forEach(id => { const el = document.getElementById(id); if (el) el.value = vitals.chol; });
        ['val_bmi', 'scan_bmi'].forEach(id => { const el = document.getElementById(id); if (el) el.value = vitals.bmi; });
        
        updateAnalyticsChartsFromInputs();
    };
    window.setInputValues = setInputValues;

    // Attach realtime live chart update on input typing for all 6 vitals fields
    ['val_age', 'val_sys_bp', 'val_dia_bp', 'val_fbs', 'val_chol', 'val_bmi',
     'scan_age', 'scan_sys_bp', 'scan_dia_bp', 'scan_fbs', 'scan_chol', 'scan_bmi'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', updateAnalyticsChartsFromInputs);
        }
    });

    const setPatientIdIfEmpty = (tag) => {
        const pValInput = document.getElementById('val_patient_id');
        const pScanInput = document.getElementById('scan_patient_id');
        if (pValInput && !pValInput.value.trim()) {
            const id = `PATIENT-${tag}-${Math.floor(1000 + Math.random() * 9000)}`;
            pValInput.value = id;
            if (pScanInput) pScanInput.value = id;
        }
    };

    if (btnPresetNormal) {
        btnPresetNormal.addEventListener('click', () => {
            setInputValues({ age: 34, sys: 118, dia: 76, fbs: 88, chol: 175, bmi: 22.4 });
            setPatientIdIfEmpty('NORM');
        });
    }

    if (btnPresetModerate) {
        btnPresetModerate.addEventListener('click', () => {
            setInputValues({ age: 58, sys: 142, dia: 90, fbs: 132, chol: 235, bmi: 28.2 });
            setPatientIdIfEmpty('MOD');
        });
    }

    if (btnPresetHigh) {
        btnPresetHigh.addEventListener('click', () => {
            setInputValues({ age: 67, sys: 175, dia: 104, fbs: 195, chol: 310, bmi: 34.8 });
            setPatientIdIfEmpty('HIGH');
        });
    }

    // 4. Tab Switching (Direct Patient Vitals vs Scan Reader)
    const btnManualTab = document.getElementById('tab_btn_manual');
    const btnScanTab = document.getElementById('tab_btn_scan');
    const panelManual = document.getElementById('panel_manual_entry');
    const panelScan = document.getElementById('panel_scan_entry');

    const activateManualTab = () => {
        if (btnManualTab) btnManualTab.classList.add('active');
        if (btnScanTab) btnScanTab.classList.remove('active');
        if (panelManual) panelManual.style.display = 'block';
        if (panelScan) panelScan.style.display = 'none';
        sidebarNavItems.forEach(item => {
            const href = item.getAttribute('href');
            if (href === '#panel_manual_entry') item.classList.add('active');
            else if (href === '#panel_scan_entry') item.classList.remove('active');
        });
    };

    const activateScanTab = () => {
        if (btnScanTab) btnScanTab.classList.add('active');
        if (btnManualTab) btnManualTab.classList.remove('active');
        if (panelScan) panelScan.style.display = 'block';
        if (panelManual) panelManual.style.display = 'none';
        sidebarNavItems.forEach(item => {
            const href = item.getAttribute('href');
            if (href === '#panel_scan_entry') item.classList.add('active');
            else if (href === '#panel_manual_entry') item.classList.remove('active');
        });
        if (panelScan) panelScan.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };
    window.activateManualTab = activateManualTab;
    window.activateScanTab = activateScanTab;

    if (btnManualTab) btnManualTab.addEventListener('click', activateManualTab);
    if (btnScanTab) btnScanTab.addEventListener('click', activateScanTab);

    // Sidebar navigation click handlers for tab panels & active link styling
    const sidebarNavItems = document.querySelectorAll('.sidebar-nav .nav-item');
    sidebarNavItems.forEach(navItem => {
        navItem.addEventListener('click', (e) => {
            const href = navItem.getAttribute('href');
            if (href === '#panel_scan_entry') {
                e.preventDefault();
                activateScanTab();
            } else if (href === '#panel_manual_entry') {
                e.preventDefault();
                activateManualTab();
            }
        });
    });

    // Hash change or direct page load check
    if (window.location.hash === '#panel_scan_entry') {
        activateScanTab();
    }

    // 5. Drag & Drop File Intake + Image Thumbnail Preview Box
    const dropZone = document.getElementById('ocr_drop_zone');
    const fileInput = document.getElementById('scan_file_input');
    const previewBox = document.getElementById('preview_box');
    const previewThumb = document.getElementById('img_preview_thumb');
    const previewFilename = document.getElementById('preview_filename');
    const previewFilesize = document.getElementById('preview_filesize');

    // Make entire dropzone box clickable to trigger file picker
    if (dropZone && fileInput) {
        dropZone.addEventListener('click', (e) => {
            if (e.target !== fileInput && e.target.getAttribute('for') !== 'scan_file_input') {
                fileInput.click();
            }
        });
    }

    const handleSelectedFile = (file) => {
        if (!file) return;
        previewFilename.innerText = file.name;
        previewFilesize.innerText = `${(file.size / 1024).toFixed(1)} KB`;

        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                previewThumb.src = e.target.result;
                previewThumb.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            previewThumb.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="%2300f2fe" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';
            previewThumb.style.display = 'block';
        }
        previewBox.style.display = 'flex';
    };

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                handleSelectedFile(e.target.files[0]);
            }
        });
    }

    if (dropZone) {
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                dropZone.classList.add('dragover');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                dropZone.classList.remove('dragover');
            }, false);
        });

        dropZone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files && files.length > 0) {
                fileInput.files = files;
                handleSelectedFile(files[0]);
            }
        });
    }

    // 6. Form Submission (Manual Ingestion Pipeline)
    const formManual = document.getElementById('form_manual_vitals');
    if (formManual) {
        formManual.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const patientId = document.getElementById('val_patient_id').value.trim();
            if (!patientId) {
                alert('⚠️ Patient ID / EHR Tag is MANDATORY.\n\nPlease enter a valid Patient ID (e.g. PATIENT-NEPH-4091) before running clinical evaluation.');
                document.getElementById('val_patient_id').focus();
                return;
            }

            const ageVal = document.getElementById('val_age').value;
            const sysVal = document.getElementById('val_sys_bp').value;
            const diaVal = document.getElementById('val_dia_bp').value;
            const fbsVal = document.getElementById('val_fbs').value;
            const cholVal = document.getElementById('val_chol').value;
            const bmiVal = document.getElementById('val_bmi').value;

            const payload = {
                age: ageVal !== '' ? parseFloat(ageVal) : 60,
                systolic_bp: sysVal !== '' ? parseFloat(sysVal) : 120,
                diastolic_bp: diaVal !== '' ? parseFloat(diaVal) : 80,
                fasting_blood_sugar: fbsVal !== '' ? parseFloat(fbsVal) : 100,
                cholesterol: cholVal !== '' ? parseFloat(cholVal) : 200,
                bmi: bmiVal !== '' ? parseFloat(bmiVal) : 24.5,
                patient_id: patientId,
                clinician_notes: document.getElementById('val_notes').value.trim() || null
            };

            await runEvaluationPipeline('/predict/manual', payload);
        });
    }

    // 7. File Upload (Scan Reader Route B)
    const btnUploadScan = document.getElementById('btn_upload_scan');
    
    if (btnUploadScan && fileInput) {
        btnUploadScan.addEventListener('click', async () => {
            const scanPatientId = (document.getElementById('scan_patient_id')?.value.trim() || document.getElementById('val_patient_id')?.value.trim());
            if (!scanPatientId) {
                alert('⚠️ Patient ID / EHR Tag is MANDATORY.\n\nPlease enter a valid Patient ID (e.g. PATIENT-SCAN-9021) for this diagnostic scan.');
                const scanIdEl = document.getElementById('scan_patient_id') || document.getElementById('val_patient_id');
                if (scanIdEl) scanIdEl.focus();
                return;
            }

            // Enforce mandatory 6 vitals
            const ageVal = document.getElementById('scan_age')?.value || document.getElementById('val_age')?.value;
            const sysVal = document.getElementById('scan_sys_bp')?.value || document.getElementById('val_sys_bp')?.value;
            const diaVal = document.getElementById('scan_dia_bp')?.value || document.getElementById('val_dia_bp')?.value;
            const fbsVal = document.getElementById('scan_fbs')?.value || document.getElementById('val_fbs')?.value;
            const cholVal = document.getElementById('scan_chol')?.value || document.getElementById('val_chol')?.value;
            const bmiVal = document.getElementById('scan_bmi')?.value || document.getElementById('val_bmi')?.value;

            const missingVitals = [];
            if (!ageVal) missingVitals.push('Patient Age');
            if (!sysVal) missingVitals.push('Systolic BP');
            if (!diaVal) missingVitals.push('Diastolic BP');
            if (!fbsVal) missingVitals.push('Fasting Blood Glucose');
            if (!cholVal) missingVitals.push('Serum Cholesterol');
            if (!bmiVal) missingVitals.push('BMI');

            if (missingVitals.length > 0) {
                alert(`⚠️ All 6 Physiological Vitals are MANDATORY for document scan evaluation.\n\nPlease fill out: ${missingVitals.join(', ')}.`);
                const firstMissing = !ageVal ? 'scan_age' : !sysVal ? 'scan_sys_bp' : !diaVal ? 'scan_dia_bp' : !fbsVal ? 'scan_fbs' : !cholVal ? 'scan_chol' : 'scan_bmi';
                const el = document.getElementById(firstMissing) || document.getElementById(firstMissing.replace('scan_', 'val_'));
                if (el) el.focus();
                return;
            }

            if (!fileInput.files || fileInput.files.length === 0) {
                alert('⚠️ Medical Scan / Document File is MANDATORY.\n\nPlease drag & drop or select a medical scan or lab report file first.');
                return;
            }

            const formData = new FormData();
            formData.append('file', fileInput.files[0]);
            formData.append('patient_id', scanPatientId);
            formData.append('age', parseFloat(ageVal));
            formData.append('sys_bp', parseFloat(sysVal));
            formData.append('dia_bp', parseFloat(diaVal));
            formData.append('fbs', parseFloat(fbsVal));
            formData.append('chol', parseFloat(cholVal));
            formData.append('bmi', parseFloat(bmiVal));

            updateProgress(20, 'Extracting Vision Embeddings via PyTorch CNN...');

            let currentProgress = 20;
            const progressInterval = setInterval(() => {
                if (currentProgress < 45) {
                    currentProgress += 5;
                    updateProgress(currentProgress, 'Extracting Vision Embeddings via PyTorch CNN...');
                } else if (currentProgress < 75) {
                    currentProgress += 4;
                    updateProgress(currentProgress, 'Executing 6-Qubit PennyLane PQC & Quantum Feature Fusion...');
                } else if (currentProgress < 92) {
                    currentProgress += 2;
                    updateProgress(currentProgress, 'Searching Pinecone Clinical Guidelines & Generating Encrypted Report...');
                }
            }, 700);

            try {
                const baseUrl = getApiBaseUrl();
                const targetUrl = baseUrl + '/predict/scan';
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 60000);

                const response = await fetch(targetUrl, {
                    method: 'POST',
                    body: formData,
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                clearInterval(progressInterval);

                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error(`HTTP 404 Not Found at "${targetUrl}".\n\nIf hosted on Vercel, please click ⚙️ in the top header to set your Render Backend API URL (e.g. https://quantacare.onrender.com).`);
                    }
                    throw new Error(`Server returned HTTP ${response.status}`);
                }

                const data = await response.json();
                updateProgress(100, 'Diagnostic Evaluation Complete');
                renderEvaluationResults(data);
            } catch (err) {
                clearInterval(progressInterval);
                const isAbort = err.name === 'AbortError';
                const isFailedToFetch = err.message.includes('Failed to fetch') || err.name === 'TypeError';
                const targetUrl = (getApiBaseUrl() || window.location.origin) + '/predict/scan';
                let msg = `Scan Processing Error: ${err.message}`;
                if (isAbort) {
                    msg = `Scan Processing Timed Out (60s).\n\nIf your backend server is waking up from sleep, please wait 20 seconds and click Upload again.`;
                } else if (isFailedToFetch) {
                    msg = `Backend Connection Failed (Failed to fetch):\nCould not reach target backend at "${targetUrl}".\n\nPossible Fixes:\n1. Verify your Railway/Render backend URL is active and uses HTTPS.\n2. Click the ⚙️ icon in the top header bar and enter your live Railway Backend URL (e.g. https://quantacare-production.up.railway.app).`;
                }
                alert(msg);
                updateProgress(0, 'Ready for Patient Evaluation');
            }
        });
    }

    // 8. Print/Export Summary Report
    const btnPrint = document.getElementById('btn_print_report');
    if (btnPrint) {
        btnPrint.addEventListener('click', () => {
            const reportContent = document.getElementById('report_container').innerText;
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <html>
                <head>
                    <title>QuantaCare Clinical Diagnostic Report</title>
                    <style>
                        body { font-family: 'Plus Jakarta Sans', sans-serif; padding: 40px; background: #fff; color: #000; font-size: 13px; line-height: 1.6; }
                        pre { white-space: pre-wrap; font-family: 'JetBrains Mono', monospace; }
                    </style>
                </head>
                <body>
                    <pre>${reportContent}</pre>
                    <script>window.print();</script>
                </body>
                </html>
            `);
            printWindow.document.close();
        });
    }
});

// Helper: Run Evaluation Pipeline with Smooth Progress Tracking
async function runEvaluationPipeline(endpoint, payload) {
    const btnSubmit = document.getElementById('btn_run_eval');
    if (btnSubmit) btnSubmit.disabled = true;

    updateProgress(20, 'Normalizing Biomarkers & Executing Rx/Ry Encodings...');

    let currentProgress = 20;
    const progressInterval = setInterval(() => {
        if (currentProgress < 50) {
            currentProgress += 10;
            updateProgress(currentProgress, 'Normalizing Biomarkers & Executing Rx/Ry Encodings...');
        } else if (currentProgress < 85) {
            currentProgress += 5;
            updateProgress(currentProgress, 'Executing 6-Qubit Quantum PQC & COBYLA Convergence...');
        }
    }, 400);

    try {
        const baseUrl = getApiBaseUrl();
        const targetUrl = endpoint.startsWith('http') ? endpoint : (baseUrl + endpoint);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        clearInterval(progressInterval);

        if (!response.ok && response.status === 404) {
            alert(`⚠️ Backend API Connection Error (HTTP 404):\nCould not reach target endpoint at "${targetUrl}".\n\nIf hosted on Vercel, please click ⚙️ in the top navigation bar to set your live Render Backend API URL (e.g. https://quantacare.onrender.com).`);
            updateProgress(0, 'Ready for Patient Evaluation');
            if (btnSubmit) btnSubmit.disabled = false;
            return;
        }

        if (response.status === 422) {
            const errDetails = await response.json();
            let msg = "Clinical Validation Error:\n";
            if (errDetails.detail && Array.isArray(errDetails.detail)) {
                errDetails.detail.forEach(err => {
                    msg += `• ${err.loc.join(' -> ')}: ${err.msg}\n`;
                });
            } else {
                msg += JSON.stringify(errDetails);
            }
            alert(msg);
            updateProgress(0, 'Ready for Patient Evaluation');
            if (btnSubmit) btnSubmit.disabled = false;
            return;
        }

        if (!response.ok) {
            throw new Error(`Execution error HTTP ${response.status}`);
        }

        const data = await response.json();
        updateProgress(100, 'Diagnostic Assessment Successfully Generated');
        renderEvaluationResults(data);
    } catch (err) {
        clearInterval(progressInterval);
        const isAbort = err.name === 'AbortError';
        const isFailedToFetch = err.message.includes('Failed to fetch') || err.name === 'TypeError';
        const baseUrl = getApiBaseUrl();
        const targetUrl = endpoint.startsWith('http') ? endpoint : ((baseUrl || window.location.origin) + endpoint);
        let msg = `Diagnostic Evaluation Exception: ${err.message}`;
        if (isAbort) {
            msg = `Evaluation Timed Out (60s).\n\nIf your backend server is waking up from sleep, please wait 20 seconds and click Submit again.`;
        } else if (isFailedToFetch) {
            msg = `Backend Connection Failed (Failed to fetch):\nCould not reach target backend at "${targetUrl}".\n\nPossible Fixes:\n1. Verify your Railway/Render backend URL is active and uses HTTPS.\n2. Click the ⚙️ icon in the top header bar and enter your live Railway Backend URL (e.g. https://quantacare-production.up.railway.app).`;
        }
        alert(msg);
        updateProgress(0, 'Ready for Patient Evaluation');
    } finally {
        if (btnSubmit) btnSubmit.disabled = false;
    }
}

// Render Results on Dashboard
function renderEvaluationResults(data, isFromHistory = false) {
    // 1. Update SVG Risk Arc Gauge
    const riskPct = Math.min(Math.max(data.risk_score_percentage || 0, 0), 100);
    const arcEl = document.getElementById('svg_risk_arc');
    if (arcEl) {
        // Semi-circle arc length (π * R = π * 40 ≈ 125.66)
        const totalArcLength = 125.66;
        const dashOffset = totalArcLength * (1 - (riskPct / 100));
        arcEl.style.strokeDashoffset = dashOffset;
    }

    // 2. Update Risk Score Text & Seal Badge
    const scoreValEl = document.getElementById('disp_risk_score');
    if (scoreValEl) scoreValEl.innerText = `${riskPct.toFixed(1)}%`;

    const sealEl = document.getElementById('wax_seal_badge');
    if (sealEl) {
        sealEl.innerText = data.risk_tier;
        sealEl.className = 'risk-pill-badge';
        if (data.risk_tier.includes('LOW')) {
            sealEl.classList.add('pill-low');
        } else if (data.risk_tier.includes('MODERATE')) {
            sealEl.classList.add('pill-moderate');
        } else {
            sealEl.classList.add('pill-high');
        }
    }

    // 3. Update Confidence Score & Diagnosed Disease / Condition
    const confEl = document.getElementById('disp_confidence');
    if (confEl) confEl.innerText = `${data.confidence_percentage}% Confidence`;

    const primaryTarget = data.primary_disease_target || "Cardiovascular Disease (CVD)";

    // Update main Diagnosed Specialty Target Card in right column
    const diseaseNameEl = document.getElementById('disp_disease_name');
    if (diseaseNameEl) {
        diseaseNameEl.innerText = primaryTarget;
    }

    // Update Stat Banner Card 2
    const statDiseaseNameEl = document.getElementById('disp_stat_disease_name');
    if (statDiseaseNameEl) {
        statDiseaseNameEl.innerText = primaryTarget;
    }

    // Update Stat Banner Card 1 (Active Specialty Domain) & Specialty Pill selection
    const activeDomainEl = document.getElementById('disp_active_domain_label');
    const targetStr = data.primary_disease_target || data.predicted_condition;
    if (targetStr) {
        if (activeDomainEl) {
            const domainPrefix = targetStr.split('—')[0].trim();
            activeDomainEl.innerText = domainPrefix;
        }
        if (typeof highlightDomainPill === 'function') {
            highlightDomainPill(targetStr);
        } else if (typeof window !== 'undefined' && typeof window.highlightDomainPill === 'function') {
            window.highlightDomainPill(targetStr);
        }
    }

    const conditionDescEl = document.getElementById('disp_condition_desc');
    if (conditionDescEl) {
        conditionDescEl.innerText = data.predicted_condition || "Diagnostic Risk Evaluation Complete";
    }

    // Render Risk Factors Tags
    const factorsContainer = document.getElementById('disp_risk_factors_container');
    if (factorsContainer && data.detected_risk_factors) {
        if (data.detected_risk_factors.length > 0) {
            let factorsHtml = '';
            data.detected_risk_factors.forEach(factor => {
                factorsHtml += `<span class="risk-factor-tag">⚠️ ${factor}</span>`;
            });
            factorsContainer.innerHTML = factorsHtml;
        } else {
            factorsContainer.innerHTML = '<span style="font-size: 0.8rem; color: var(--risk-low); font-weight: 600;">✓ Optimal physiological biomarkers detected</span>';
        }
    }

    // 4. Render Doctor-Friendly Biomarker Health Cards
    const qubitContainer = document.getElementById('qubit_telemetry_container');
    if (qubitContainer && data.quantum_telemetry) {
        const tel = data.quantum_telemetry;
        const features = data.processed_feature_vector || [0, 0, 0, 0, 0, 0];
        let html = '';
        const featureLabels = ['Age', 'Systolic BP', 'Diastolic BP', 'Glucose', 'Cholesterol', 'BMI'];

        // Clinical threshold bounds on normalized feature vector [0, 1] -> [lowMax, modMax]
        const thresholds = [
            [0.42, 0.55], // Age: <50 Normal, 50-65 Elevated, >65 High Risk
            [0.39, 0.50], // Sys BP: <130 Normal, 130-150 Elevated, >150 High Risk
            [0.41, 0.50], // Dia BP: <85 Normal, 85-95 Elevated, >95 High Risk
            [0.18, 0.26], // FBS: <110 Normal, 110-140 Elevated, >140 High Risk
            [0.25, 0.35], // Chol: <200 Normal, 200-240 Elevated, >240 High Risk
            [0.30, 0.40]  // BMI: <25 Normal, 25-30 Elevated, >30 High Risk
        ];

        for (let i = 0; i < 6; i++) {
            const featVal = features[i] !== undefined ? features[i] : 0;
            const prob = tel.quantum_probabilities[i];
            
            let status = 'Optimal';
            let statusColor = 'var(--risk-low)';

            const [lowMax, modMax] = thresholds[i];
            if (featVal >= modMax) {
                status = 'High Risk';
                statusColor = 'var(--risk-high)';
            } else if (featVal >= lowMax) {
                status = 'Elevated';
                statusColor = 'var(--risk-moderate)';
            }

            html += `
                <div class="biomarker-card">
                    <div class="biomarker-title">${featureLabels[i]}</div>
                    <div class="biomarker-val" style="color: ${statusColor};">${status}</div>
                    <div style="color: var(--text-muted); font-size: 0.7rem; margin-top: 2px;">VQC Index: ${(prob * 100).toFixed(1)}%</div>
                </div>
            `;
        }
        qubitContainer.innerHTML = html;

        // Update Chart.js Clinical Analytics
        if (typeof updateAnalyticsCharts === 'function' && data.processed_feature_vector) {
            updateAnalyticsCharts(data.processed_feature_vector);
        }
    }

    // 5. Render Evidence-Based Pinecone Reference Cases
    const pineconeContainer = document.getElementById('pinecone_matches_container');
    if (pineconeContainer && data.pinecone_matches) {
        let html = '';
        data.pinecone_matches.forEach(item => {
            html += `
                <div class="case-card">
                    <span class="case-score-badge">${(item.score * 100).toFixed(1)}% Match</span>
                    <div class="case-condition">${item.metadata.condition || 'Clinical Guideline Reference'}</div>
                    <div class="case-summary">${item.summary}</div>
                </div>
            `;
        });
        pineconeContainer.innerHTML = html;
    }

    // 6. Render Clinical Summary Ledger
    const reportContainer = document.getElementById('report_container');
    if (reportContainer) {
        reportContainer.innerText = data.clinical_summary_report;
    }

    // 7. Update Multi-Modal Vision & Fusion Telemetry
    const fusionModeBadge = document.getElementById('disp_fusion_mode');
    if (fusionModeBadge) {
        fusionModeBadge.innerText = data.has_image_input ? 'Multi-Modal Vision Analysis' : 'Tabular Analysis Mode';
    }

    const imageStatusEl = document.getElementById('disp_image_status');
    const fusionDescEl = document.getElementById('disp_fusion_desc');
    if (imageStatusEl) {
        if (data.has_image_input) {
            imageStatusEl.innerHTML = '<span style="color: var(--risk-low); font-weight: 700;">✓ Medical Scan Embeddings Merged</span>';
            if (fusionDescEl) fusionDescEl.innerText = 'PyTorch MobileNetV3 (512d) + PennyLane QML (6q)';
        } else {
            imageStatusEl.innerText = 'No Scan Uploaded (Tabular Vitals)';
            if (fusionDescEl) fusionDescEl.innerText = 'Quantum Expectation + Clinical Bounds';
        }
    }

    // 8. Automatically Store Record in Local History Ledger (if not loaded from history)
    if (!isFromHistory) {
        savePatientRecordToHistory(data);
    }
}

function updateProgress(percentage, statusText) {
    const progressBar = document.getElementById('main_progress_bar');
    const statusEl = document.getElementById('disp_step_status');
    if (progressBar) progressBar.style.width = `${percentage}%`;
    if (statusEl) statusEl.innerText = statusText;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/* ==========================================================================
   PATIENT DIAGNOSTIC HISTORY LEDGER PERSISTENCE
   ========================================================================== */

function savePatientRecordToHistory(data) {
    let history = [];
    try {
        history = JSON.parse(localStorage.getItem('quantacare_patient_records') || '[]');
    } catch (e) { history = []; }

    const ageVal = parseFloat(document.getElementById('val_age')?.value || document.getElementById('scan_age')?.value || 60);
    const sysVal = parseFloat(document.getElementById('val_sys_bp')?.value || document.getElementById('scan_sys_bp')?.value || 120);
    const diaVal = parseFloat(document.getElementById('val_dia_bp')?.value || document.getElementById('scan_dia_bp')?.value || 80);
    const fbsVal = parseFloat(document.getElementById('val_fbs')?.value || document.getElementById('scan_fbs')?.value || 100);
    const cholVal = parseFloat(document.getElementById('val_chol')?.value || document.getElementById('scan_chol')?.value || 200);
    const bmiVal = parseFloat(document.getElementById('val_bmi')?.value || document.getElementById('scan_bmi')?.value || 24.5);

    const previewBox = document.getElementById('preview_box');
    const previewThumb = document.getElementById('img_preview_thumb');
    const previewFilename = document.getElementById('preview_filename');
    const previewFilesize = document.getElementById('preview_filesize');

    let scanFileInfo = null;
    if (previewBox && previewBox.style.display !== 'none') {
        scanFileInfo = {
            name: previewFilename?.innerText || 'clinical_scan_image.png',
            size: previewFilesize?.innerText || '142 KB',
            thumb: previewThumb?.src || '',
            has_scan: true
        };
    } else if (data && data.has_image_input) {
        scanFileInfo = {
            name: 'medical_scan_image.png',
            size: '256 KB',
            thumb: '',
            has_scan: true
        };
    }

    const recordData = Object.assign({}, data, { scan_file_info: scanFileInfo });

    const record = {
        id: data.patient_id || `PATIENT-${Math.floor(1000 + Math.random() * 9000)}`,
        date: new Date().toLocaleString(),
        target: data.primary_disease_target || 'General Evaluation',
        condition: data.predicted_condition || 'Diagnostic Risk Assessment',
        risk_tier: data.risk_tier || 'MODERATE RISK',
        risk_score: data.risk_score_percentage || 50.0,
        report: data.clinical_summary_report,
        raw_vitals: { age: ageVal, sys: sysVal, dia: diaVal, fbs: fbsVal, chol: cholVal, bmi: bmiVal },
        scan_file_info: scanFileInfo,
        data: recordData
    };

    // Avoid duplicate rapid saves of identical timestamp/id
    if (history.length > 0 && history[0].id === record.id && history[0].condition === record.condition) {
        history[0] = record;
    } else {
        history.unshift(record);
    }

    localStorage.setItem('quantacare_patient_records', JSON.stringify(history));
    updateStoredRecordsCount();
}

function updateStoredRecordsCount() {
    let history = [];
    try {
        history = JSON.parse(localStorage.getItem('quantacare_patient_records') || '[]');
    } catch (e) { history = []; }

    const countEl = document.getElementById('stored_records_count');
    if (countEl) countEl.innerText = history.length;
}

function renderStoredRecordsList() {
    let history = [];
    try {
        history = JSON.parse(localStorage.getItem('quantacare_patient_records') || '[]');
    } catch (e) { history = []; }

    const container = document.getElementById('history_list_container');
    if (!container) return;

    if (history.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 30px; font-size: 0.85rem;">No saved patient diagnostic records found in local ledger.</div>';
        return;
    }

    const searchVal = (document.getElementById('history_search_input')?.value || '').toLowerCase();

    let html = '';
    history.forEach((rec, idx) => {
        if (searchVal && !rec.id.toLowerCase().includes(searchVal) && !rec.target.toLowerCase().includes(searchVal) && !rec.condition.toLowerCase().includes(searchVal)) {
            return;
        }

        let tierClass = (rec.risk_tier || '').includes('LOW') ? 'pill-low' : ((rec.risk_tier || '').includes('MODERATE') ? 'pill-moderate' : 'pill-high');
        const hasScanDoc = (rec.scan_file_info && rec.scan_file_info.has_scan) || (rec.data && rec.data.has_image_input);
        const docBadge = hasScanDoc ? '<span style="font-size: 0.7rem; background: #e0f2fe; color: #0284c7; padding: 2px 8px; border-radius: 4px; font-weight: 700; margin-left: 6px;">🩻 Scan Doc Attached</span>' : '';

        html += `
            <div class="history-item-card">
                <div class="history-item-info">
                    <div class="history-item-meta">⏱️ ${rec.date || ''} • 🏷️ ID: ${rec.id || ''}${docBadge}</div>
                    <div class="history-item-title">${rec.target || 'General Diagnostic Evaluation'}</div>
                    <div class="history-item-sub">${rec.condition || 'Diagnostic Risk Assessment'}</div>
                </div>
                <div>
                    <span class="risk-pill-badge ${tierClass}" style="font-size: 0.72rem; padding: 4px 12px; margin-right: 8px;">${rec.risk_tier || 'EVALUATED'}</span>
                    <button type="button" class="btn-load-record" data-index="${idx}" onclick="loadHistoryRecord(${idx})">Load Record</button>
                </div>
            </div>
        `;
    });

    container.innerHTML = html || '<div style="text-align: center; color: var(--text-muted); padding: 20px;">No matching patient records found in search.</div>';

    // Programmatic event listener binding fallback
    container.querySelectorAll('.btn-load-record').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idxAttr = e.currentTarget.getAttribute('data-index');
            if (idxAttr !== null) {
                const idx = parseInt(idxAttr, 10);
                loadHistoryRecord(idx);
            }
        });
    });
}

function loadHistoryRecord(idx) {
    let history = [];
    try {
        history = JSON.parse(localStorage.getItem('quantacare_patient_records') || '[]');
    } catch (e) { history = []; }

    const record = history[idx];
    if (!record) {
        alert('⚠️ Selected patient record could not be loaded from local storage.');
        return;
    }

    // Handle both rich data objects and legacy flat records
    const dataToRender = record.data || {
        patient_id: record.id || `PATIENT-${Math.floor(1000 + Math.random() * 9000)}`,
        risk_score_percentage: record.risk_score !== undefined ? record.risk_score : 50.0,
        risk_tier: record.risk_tier || 'MODERATE RISK',
        confidence_percentage: 95.0,
        primary_disease_target: record.target || 'Cardiovascular Disease (CVD)',
        predicted_condition: record.condition || 'Diagnostic Risk Evaluation Complete',
        detected_risk_factors: [],
        quantum_telemetry: {
            qubits_allocated: 6,
            circuit_depth: 18,
            quantum_probabilities: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5]
        },
        processed_feature_vector: record.raw_vitals ? [
            Math.min(Math.max((record.raw_vitals.age - 1) / 119, 0), 1),
            Math.min(Math.max((record.raw_vitals.sys - 60) / 180, 0), 1),
            Math.min(Math.max((record.raw_vitals.dia - 40) / 110, 0), 1),
            Math.min(Math.max((record.raw_vitals.fbs - 50) / 350, 0), 1),
            Math.min(Math.max((record.raw_vitals.chol - 100) / 400, 0), 1),
            Math.min(Math.max((record.raw_vitals.bmi - 10) / 50, 0), 1)
        ] : [0.4, 0.33, 0.36, 0.14, 0.25, 0.29],
        pinecone_matches: [],
        clinical_summary_report: record.report || `================================================================================\nQUANTACARE CLINICAL AI DIAGNOSTIC ASSESSMENT LEDGER\n================================================================================\nPatient ID: ${record.id}\nTarget Specialty: ${record.target}\nRisk Assessment: ${record.risk_tier}\n================================================================================`,
        has_image_input: !!(record.scan_file_info && record.scan_file_info.has_scan)
    };

    // 1. Auto-fill Patient ID across both intake forms
    const pId = record.id || dataToRender.patient_id;
    ['val_patient_id', 'scan_patient_id'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = pId;
    });

    // 2. Auto-fill 6 physiological vitals across both intake forms
    if (record.raw_vitals) {
        if (typeof window.setInputValues === 'function') {
            window.setInputValues(record.raw_vitals);
        }
    } else if (dataToRender.processed_feature_vector && dataToRender.processed_feature_vector.length === 6) {
        const f = dataToRender.processed_feature_vector;
        const vitalsObj = {
            age: Math.round(1 + f[0] * 119),
            sys: Math.round(60 + f[1] * 180),
            dia: Math.round(40 + f[2] * 110),
            fbs: Math.round(50 + f[3] * 350),
            chol: Math.round(100 + f[4] * 400),
            bmi: (10 + f[5] * 50).toFixed(1)
        };
        if (typeof window.setInputValues === 'function') {
            window.setInputValues(vitalsObj);
        }
    }

    // 3. Restore Document Scan Preview (if given with vitals)
    const scanInfo = record.scan_file_info || dataToRender.scan_file_info || (dataToRender.has_image_input ? { name: 'medical_scan_image.png', size: '256 KB', thumb: '', has_scan: true } : null);
    const previewBox = document.getElementById('preview_box');
    const previewThumb = document.getElementById('img_preview_thumb');
    const previewFilename = document.getElementById('preview_filename');
    const previewFilesize = document.getElementById('preview_filesize');

    if (scanInfo && scanInfo.has_scan) {
        if (previewFilename) previewFilename.innerText = scanInfo.name || 'medical_scan_image.png';
        if (previewFilesize) previewFilesize.innerText = scanInfo.size || '142 KB';
        if (previewThumb) {
            previewThumb.src = scanInfo.thumb || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="%2300f2fe" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';
            previewThumb.style.display = 'block';
        }
        if (previewBox) previewBox.style.display = 'flex';

        if (typeof window.activateScanTab === 'function') {
            window.activateScanTab();
        }
    } else {
        if (previewBox) previewBox.style.display = 'none';
        if (typeof window.activateManualTab === 'function') {
            window.activateManualTab();
        }
    }

    // 4. Render all evaluation results into dashboard cards (pass true to avoid re-saving duplicate)
    renderEvaluationResults(dataToRender, true);

    // 5. Highlight corresponding specialty domain pill
    if (typeof window.highlightDomainPill === 'function') {
        window.highlightDomainPill(record.target || dataToRender.primary_disease_target || dataToRender.predicted_condition);
    }

    // 6. Update charts from input values
    if (typeof window.updateAnalyticsChartsFromInputs === 'function') {
        window.updateAnalyticsChartsFromInputs();
    }

    // 7. Hide history modal if open
    const modal = document.getElementById('history_modal');
    if (modal) modal.style.display = 'none';

    // 8. Scroll smoothly to top workspace grid
    const workspaceEl = document.querySelector('.dashboard-grid') || document.getElementById('panel_manual_entry');
    if (workspaceEl) workspaceEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

window.loadHistoryRecord = loadHistoryRecord;
window.renderStoredRecordsList = renderStoredRecordsList;
