document.addEventListener('DOMContentLoaded', () => {

    /* ==========================================================================
       0. INITIALIZATION & WORKSPACE RESET
       ========================================================================== */

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
        if (diseaseNameEl) diseaseNameEl.innerText = 'Awaiting Input';

        const statDiseaseNameEl = document.getElementById('disp_stat_disease_name');
        if (statDiseaseNameEl) statDiseaseNameEl.innerText = 'Awaiting Evaluation';

        const conditionDescEl = document.getElementById('disp_condition_desc');
        if (conditionDescEl) conditionDescEl.innerText = 'Enter patient vitals or upload a medical scan to trigger quantum consensus.';

        const activeDomainEl = document.getElementById('disp_active_domain_label');
        if (activeDomainEl) activeDomainEl.innerText = 'Cardiology Domain';

        const confEl = document.getElementById('disp_confidence');
        if (confEl) confEl.innerText = '--% Confidence';

        const factorsContainer = document.getElementById('disp_risk_factors_container');
        if (factorsContainer) factorsContainer.innerHTML = '<span style="font-size: 0.75rem; color: var(--text-muted);">ℹ️ No risk factors detected</span>';

        const qubitContainer = document.getElementById('qubit_telemetry_container');
        if (qubitContainer) {
            const featureLabels = ['Age', 'Sys BP', 'Dia BP', 'Glucose', 'Chol', 'BMI'];
            let html = '';
            featureLabels.forEach(lbl => {
                html += `
                    <div class="qubit-mini-card">
                        <div class="qubit-mini-title">${lbl}</div>
                        <div class="qubit-mini-val">--</div>
                        <div class="qubit-mini-vqc">VQC: --%</div>
                    </div>
                `;
            });
            qubitContainer.innerHTML = html;
        }

        const pineconeContainer = document.getElementById('pinecone_matches_container');
        if (pineconeContainer) {
            pineconeContainer.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 20px; font-size: 0.8rem;">Awaiting evaluation trigger to match evidence-based medical guidelines.</div>';
        }

        const reportContainer = document.getElementById('report_container');
        if (reportContainer) {
            reportContainer.innerText = `================================================================================
QUANTACARE CLINICAL TELEMETRY COMMAND CENTER
================================================================================
Status: Awaiting Intake Stream
--------------------------------------------------------------------------------
No active patient record loaded. Please enter physiological vitals or upload 
a diagnostic image scan to initiate 6-qubit PQC evaluation.
================================================================================`;
        }

        const fusionModeBadge = document.getElementById('disp_fusion_mode');
        if (fusionModeBadge) fusionModeBadge.innerText = 'Tabular Analysis Mode';

        const previewBox = document.getElementById('preview_box');
        if (previewBox) previewBox.style.display = 'none';

        const fileInput = document.getElementById('scan_file_input');
        if (fileInput) fileInput.value = '';

        resetQubitSVGVisualizer();
        resetTerminalTicker();
        clearAnalyticsCharts();
    };

    /* ==========================================================================
       1. LIVE INTERACTIVE 6-QUBIT SVG CIRCUIT VISUALIZER
       ========================================================================== */

    const resetQubitSVGVisualizer = () => {
        for (let i = 0; i < 6; i++) {
            const wire = document.getElementById(`wire_q${i}`);
            if (wire) wire.classList.remove('active');
            const node = document.getElementById(`node_q${i}`);
            if (node) {
                node.setAttribute('fill', '#0f172a');
                node.setAttribute('stroke', '#22d3ee');
                node.classList.remove('qubit-node-pulse');
            }
            const mOp = document.getElementById(`m_q${i}`);
            if (mOp) mOp.setAttribute('fill', '#10b981');
        }
    };

    const animateQubitSVGVisualizer = (probabilities = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5]) => {
        for (let i = 0; i < 6; i++) {
            const wire = document.getElementById(`wire_q${i}`);
            if (wire) wire.classList.add('active');

            const node = document.getElementById(`node_q${i}`);
            if (node) {
                node.classList.add('qubit-node-pulse');
                const prob = probabilities[i] !== undefined ? probabilities[i] : 0.5;
                if (prob > 0.65) {
                    node.setAttribute('stroke', '#f43f5e'); // High risk rose
                } else if (prob > 0.45) {
                    node.setAttribute('stroke', '#f59e0b'); // Moderate amber
                } else {
                    node.setAttribute('stroke', '#10b981'); // Optimal emerald
                }
            }
        }
    };

    /* ==========================================================================
       2. CINEMATIC PROCESSING TELEMETRY PIPELINE (1.5s SEQUENCE)
       ========================================================================== */

    const resetTerminalTicker = () => {
        const tickerBox = document.getElementById('terminal_ticker_lines');
        if (tickerBox) {
            tickerBox.innerHTML = '<div class="ticker-line"><span class="ticker-prompt">&gt;</span> <span class="ticker-text">System standby. Awaiting evaluation trigger...</span></div>';
        }
        updateProgress(0, 'Ready for Patient Evaluation');
    };

    const runCinematicTelemetrySequence = async (isScan = false) => {
        const tickerBox = document.getElementById('terminal_ticker_lines');
        if (!tickerBox) return;

        tickerBox.innerHTML = '';
        
        const steps = [
            { text: "Initializing PennyLane default.qubit PQC backend...", pct: 20, delay: 0 },
            { text: "Normalizing 6-variable clinical parameter array...", pct: 40, delay: 300 },
            { text: isScan ? "Executing PyTorch MobileNetV3 CNN vision embedding (512-dim)..." : "Calculating Rx/Ry Rotation Feature Encodings...", pct: 65, delay: 350 },
            { text: "Resolving COBYLA hybrid optimizer convergence...", pct: 85, delay: 400 },
            { text: "Consensus reached. Rendering multi-modal risk score.", pct: 100, delay: 400 }
        ];

        for (const step of steps) {
            if (step.delay > 0) await sleep(step.delay);

            const lineEl = document.createElement('div');
            lineEl.className = 'ticker-line';
            const isLast = step.pct === 100;
            lineEl.innerHTML = `
                <span class="ticker-prompt">&gt;</span>
                <span class="ticker-text ${isLast ? 'ticker-success' : ''}">${step.text}</span>
            `;
            tickerBox.appendChild(lineEl);
            tickerBox.scrollTop = tickerBox.scrollHeight;

            updateProgress(step.pct, step.text);
            animateQubitSVGVisualizer();
        }
    };

    /* ==========================================================================
       3. CHART.JS OBSIDIAN SPECTRUM ANALYTICS ENGINE
       ========================================================================== */

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
                            label: 'Patient Spectrum',
                            data: [null, null, null, null, null, null],
                            borderColor: '#22d3ee',
                            backgroundColor: 'rgba(34, 211, 238, 0.12)',
                            fill: true,
                            tension: 0.3,
                            borderWidth: 2.5,
                            pointBackgroundColor: '#22d3ee',
                            pointRadius: 4
                        },
                        {
                            label: 'Optimal Baseline',
                            data: [null, null, null, null, null, null],
                            borderColor: '#10b981',
                            borderDash: [4, 4],
                            borderWidth: 1.5,
                            pointRadius: 0,
                            fill: false
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { min: 0, max: 1, grid: { color: '#1e293b' }, ticks: { color: '#94a3b8' } },
                        x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
                    },
                    plugins: { legend: { position: 'top', labels: { color: '#f8fafc', font: { family: 'JetBrains Mono', size: 10 } } } }
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
                            label: '6-Qubit State Vector',
                            data: [null, null, null, null, null, null],
                            borderColor: '#10b981',
                            backgroundColor: 'rgba(16, 185, 129, 0.18)',
                            borderWidth: 2,
                            pointBackgroundColor: '#10b981',
                            pointRadius: 4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        r: {
                            angleLines: { color: '#1e293b' },
                            grid: { color: '#1e293b' },
                            suggestedMin: 0,
                            suggestedMax: 1,
                            pointLabels: { color: '#94a3b8', font: { family: 'JetBrains Mono', size: 10 } },
                            ticks: { display: false }
                        }
                    },
                    plugins: { legend: { position: 'top', labels: { color: '#f8fafc', font: { family: 'JetBrains Mono', size: 10 } } } }
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

    /* ==========================================================================
       4. DYNAMIC MULTI-MODAL SPECIALTY ROUTING (7 DOMAINS)
       ========================================================================== */

    const domainPresets = {
        cardiology: { label: 'Cardiology Domain', disease: 'Cardiovascular Disease (CVD)', tag: 'CARDIO', vitals: { age: 62, sys: 155, dia: 95, fbs: 110, chol: 245, bmi: 29.1 } },
        neurology: { label: 'Neurology Domain', disease: 'Neurodegenerative Risk / Stroke', tag: 'NEURO', vitals: { age: 68, sys: 138, dia: 88, fbs: 105, chol: 210, bmi: 25.4 } },
        orthopedics: { label: 'Orthopedics Domain', disease: 'Bone Fracture & Musculoskeletal Risk', tag: 'ORTHO', vitals: { age: 45, sys: 122, dia: 78, fbs: 92, chol: 185, bmi: 24.2 } },
        pulmonology: { label: 'Pulmonology Domain', disease: 'Pulmonary / Thoracic Radiograph Risk', tag: 'PULMO', vitals: { age: 54, sys: 130, dia: 82, fbs: 98, chol: 195, bmi: 26.0 } },
        endocrinology: { label: 'Endocrinology Domain', disease: 'Diabetes & Metabolic Syndrome', tag: 'ENDO', vitals: { age: 52, sys: 140, dia: 88, fbs: 165, chol: 230, bmi: 31.5 } },
        nephrology: { label: 'Nephrology Domain', disease: 'Chronic Kidney Disease (CKD)', tag: 'NEPH', vitals: { age: 60, sys: 148, dia: 92, fbs: 125, chol: 220, bmi: 27.8 } },
        oncology: { label: 'Oncology Domain', disease: 'Malignancy / Tissue Pathology Risk', tag: 'ONCO', vitals: { age: 59, sys: 135, dia: 85, fbs: 108, chol: 205, bmi: 25.0 } }
    };

    function highlightDomainPill(targetString) {
        const specialtyBtns = document.querySelectorAll('.specialty-btn');
        specialtyBtns.forEach(b => b.classList.remove('active'));

        if (!targetString) return;

        const lowerTarget = targetString.toLowerCase();
        for (const btn of specialtyBtns) {
            const domainKey = btn.getAttribute('data-domain');
            if (lowerTarget.includes(domainKey) || (domainPresets[domainKey] && lowerTarget.includes(domainPresets[domainKey].tag.toLowerCase()))) {
                btn.classList.add('active');
                const labelEl = document.getElementById('disp_active_domain_label');
                if (labelEl && domainPresets[domainKey]) labelEl.innerText = domainPresets[domainKey].label;
                break;
            }
        }
    }
    window.highlightDomainPill = highlightDomainPill;

    // Attach click handlers to all 7 specialty pills
    document.querySelectorAll('.specialty-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const domainKey = btn.getAttribute('data-domain');
            const preset = domainPresets[domainKey];
            if (!preset) return;

            document.querySelectorAll('.specialty-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const labelEl = document.getElementById('disp_active_domain_label');
            if (labelEl) labelEl.innerText = preset.label;

            const targetTitleEl = document.getElementById('disp_disease_name');
            if (targetTitleEl) targetTitleEl.innerText = preset.disease;

            const statDiseaseEl = document.getElementById('disp_stat_disease_name');
            if (statDiseaseEl) statDiseaseEl.innerText = preset.disease;

            setInputValues(preset.vitals);
            setPatientIdIfEmpty(preset.tag);
        });
    });

    /* ==========================================================================
       5. REALTIME SYNCHRONIZATION & PRESETS
       ========================================================================== */

    clearFormInputs();
    resetOutputCardsToInitialState();
    updateStoredRecordsCount();

    // Reset Workspace Button
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

    // Attach live chart updates
    ['val_age', 'val_sys_bp', 'val_dia_bp', 'val_fbs', 'val_chol', 'val_bmi',
     'scan_age', 'scan_sys_bp', 'scan_dia_bp', 'scan_fbs', 'scan_chol', 'scan_bmi'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', updateAnalyticsChartsFromInputs);
    });

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

    const setPatientIdIfEmpty = (tag) => {
        const pValInput = document.getElementById('val_patient_id');
        const pScanInput = document.getElementById('scan_patient_id');
        if (pValInput && !pValInput.value.trim()) {
            const id = `PATIENT-${tag}-${Math.floor(1000 + Math.random() * 9000)}`;
            pValInput.value = id;
            if (pScanInput) pScanInput.value = id;
        }
    };

    // Cohort Preset Buttons
    const btnPresetNormal = document.getElementById('preset_normal');
    const btnPresetModerate = document.getElementById('preset_moderate');
    const btnPresetHigh = document.getElementById('preset_high');

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

    /* ==========================================================================
       6. TAB SWITCHING (MANUAL vs SCAN READER)
       ========================================================================== */

    const btnManualTab = document.getElementById('tab_btn_manual');
    const btnScanTab = document.getElementById('tab_btn_scan');
    const panelManual = document.getElementById('panel_manual_entry');
    const panelScan = document.getElementById('panel_scan_entry');

    const activateManualTab = () => {
        if (btnManualTab) btnManualTab.classList.add('active');
        if (btnScanTab) btnScanTab.classList.remove('active');
        if (panelManual) panelManual.style.display = 'block';
        if (panelScan) panelScan.style.display = 'none';

        const railScan = document.getElementById('rail_nav_scan');
        const railVitals = document.getElementById('rail_nav_vitals');
        if (railVitals) railVitals.classList.add('active');
        if (railScan) railScan.classList.remove('active');
    };

    const activateScanTab = () => {
        if (btnScanTab) btnScanTab.classList.add('active');
        if (btnManualTab) btnManualTab.classList.remove('active');
        if (panelScan) panelScan.style.display = 'block';
        if (panelManual) panelManual.style.display = 'none';

        const railScan = document.getElementById('rail_nav_scan');
        const railVitals = document.getElementById('rail_nav_vitals');
        if (railScan) railScan.classList.add('active');
        if (railVitals) railVitals.classList.remove('active');

        if (panelScan) panelScan.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };
    window.activateManualTab = activateManualTab;
    window.activateScanTab = activateScanTab;

    if (btnManualTab) btnManualTab.addEventListener('click', activateManualTab);
    if (btnScanTab) btnScanTab.addEventListener('click', activateScanTab);

    // Protocol Guide Toggle
    const btnGuideToggle = document.getElementById('btn_guide_toggle');
    const guideBox = document.getElementById('guide_box');
    if (btnGuideToggle && guideBox) {
        btnGuideToggle.addEventListener('click', () => {
            const isVisible = guideBox.style.display !== 'none';
            guideBox.style.display = isVisible ? 'none' : 'block';
        });
    }

    /* ==========================================================================
       7. DRAG & DROP MEDICAL SCAN INTAKE
       ========================================================================== */

    const dropZone = document.getElementById('ocr_drop_zone');
    const fileInput = document.getElementById('scan_file_input');
    const previewBox = document.getElementById('preview_box');
    const previewThumb = document.getElementById('img_preview_thumb');
    const previewFilename = document.getElementById('preview_filename');
    const previewFilesize = document.getElementById('preview_filesize');

    if (dropZone && fileInput) {
        dropZone.addEventListener('click', (e) => {
            if (e.target !== fileInput && e.target.getAttribute('for') !== 'scan_file_input') {
                fileInput.click();
            }
        });
    }

    const handleSelectedFile = (file) => {
        if (!file) return;
        if (previewFilename) previewFilename.innerText = file.name;
        if (previewFilesize) previewFilesize.innerText = `${(file.size / 1024).toFixed(1)} KB`;

        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                if (previewThumb) {
                    previewThumb.src = e.target.result;
                    previewThumb.style.display = 'block';
                }
            };
            reader.readAsDataURL(file);
        } else {
            if (previewThumb) {
                previewThumb.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="%2322d3ee" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';
                previewThumb.style.display = 'block';
            }
        }
        if (previewBox) previewBox.style.display = 'flex';
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

    /* ==========================================================================
       8. FORM SUBMISSIONS & PIPELINE EXECUTION
       ========================================================================== */

    const formManual = document.getElementById('form_manual_vitals');
    if (formManual) {
        formManual.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const patientId = document.getElementById('val_patient_id').value.trim();
            if (!patientId) {
                alert('⚠️ Patient ID / EHR Tag is MANDATORY.');
                document.getElementById('val_patient_id').focus();
                return;
            }

            const payload = {
                age: parseFloat(document.getElementById('val_age').value || 60),
                systolic_bp: parseFloat(document.getElementById('val_sys_bp').value || 120),
                diastolic_bp: parseFloat(document.getElementById('val_dia_bp').value || 80),
                fasting_blood_sugar: parseFloat(document.getElementById('val_fbs').value || 100),
                cholesterol: parseFloat(document.getElementById('val_chol').value || 200),
                bmi: parseFloat(document.getElementById('val_bmi').value || 24.5),
                patient_id: patientId,
                clinician_notes: document.getElementById('val_notes').value.trim() || null
            };

            await runEvaluationPipeline('/predict/manual', payload, false);
        });
    }

    const btnUploadScan = document.getElementById('btn_upload_scan');
    if (btnUploadScan && fileInput) {
        btnUploadScan.addEventListener('click', async () => {
            const scanPatientId = (document.getElementById('scan_patient_id')?.value.trim() || document.getElementById('val_patient_id')?.value.trim());
            if (!scanPatientId) {
                alert('⚠️ Patient ID / EHR Tag is MANDATORY.');
                const scanIdEl = document.getElementById('scan_patient_id') || document.getElementById('val_patient_id');
                if (scanIdEl) scanIdEl.focus();
                return;
            }

            const ageVal = document.getElementById('scan_age')?.value || document.getElementById('val_age')?.value;
            const sysVal = document.getElementById('scan_sys_bp')?.value || document.getElementById('val_sys_bp')?.value;
            const diaVal = document.getElementById('scan_dia_bp')?.value || document.getElementById('val_dia_bp')?.value;
            const fbsVal = document.getElementById('scan_fbs')?.value || document.getElementById('val_fbs')?.value;
            const cholVal = document.getElementById('scan_chol')?.value || document.getElementById('val_chol')?.value;
            const bmiVal = document.getElementById('scan_bmi')?.value || document.getElementById('val_bmi')?.value;

            if (!ageVal || !sysVal || !diaVal || !fbsVal || !cholVal || !bmiVal) {
                alert('⚠️ All 6 Physiological Vitals are MANDATORY for scan evaluation.');
                return;
            }

            if (!fileInput.files || fileInput.files.length === 0) {
                alert('⚠️ Medical Scan File is MANDATORY.');
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

            await runEvaluationPipeline('/predict/scan', formData, true);
        });
    }

    // Print Report
    const btnPrint = document.getElementById('btn_print_report');
    const btnPrintSec = document.getElementById('btn_print_report_sec');
    const handlePrint = () => {
        const reportContent = document.getElementById('report_container').innerText;
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
            <head>
                <title>QuantaCare EHR Diagnostic Report</title>
                <style>
                    body { font-family: 'Space Grotesk', sans-serif; padding: 40px; background: #fff; color: #000; font-size: 13px; line-height: 1.6; }
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
    };
    if (btnPrint) btnPrint.addEventListener('click', handlePrint);
    if (btnPrintSec) btnPrintSec.addEventListener('click', handlePrint);
});

/* ==========================================================================
   GLOBAL PIPELINE EXECUTION & RESULTS RENDERING
   ========================================================================== */

async function runEvaluationPipeline(endpoint, bodyData, isScan = false) {
    const btnSubmit = document.getElementById('btn_run_eval');
    if (btnSubmit) btnSubmit.disabled = true;

    // Trigger cinematic 1.5s sequence
    const sequencePromise = runCinematicTelemetrySequence(isScan);

    try {
        let options = { method: 'POST' };
        if (isScan) {
            options.body = bodyData;
        } else {
            options.headers = { 'Content-Type': 'application/json' };
            options.body = JSON.stringify(bodyData);
        }

        const response = await fetch(endpoint, options);

        if (!response.ok) {
            throw new Error(`Execution error HTTP ${response.status}`);
        }

        const data = await response.json();
        await sequencePromise; // Ensure sequence finishes 1.5s sequence smoothly
        renderEvaluationResults(data);
    } catch (err) {
        alert(`Diagnostic Evaluation Exception: ${err.message}`);
        updateProgress(0, 'Ready for Patient Evaluation');
    } finally {
        if (btnSubmit) btnSubmit.disabled = false;
    }
}

function renderEvaluationResults(data, isFromHistory = false) {
    // 1. Update SVG Risk Arc Gauge
    const riskPct = Math.min(Math.max(data.risk_score_percentage || 0, 0), 100);
    const arcEl = document.getElementById('svg_risk_arc');
    if (arcEl) {
        const totalArcLength = 125.66;
        const dashOffset = totalArcLength * (1 - (riskPct / 100));
        arcEl.style.strokeDashoffset = dashOffset;
    }

    // 2. Score & Seal Badge
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

    // 3. Diagnosed Condition & Confidence
    const confEl = document.getElementById('disp_confidence');
    if (confEl) confEl.innerText = `${data.confidence_percentage}% Confidence`;

    const primaryTarget = data.primary_disease_target || "Cardiovascular Disease (CVD)";
    const diseaseNameEl = document.getElementById('disp_disease_name');
    if (diseaseNameEl) diseaseNameEl.innerText = primaryTarget;

    const statDiseaseNameEl = document.getElementById('disp_stat_disease_name');
    if (statDiseaseNameEl) statDiseaseNameEl.innerText = primaryTarget;

    const conditionDescEl = document.getElementById('disp_condition_desc');
    if (conditionDescEl) conditionDescEl.innerText = data.predicted_condition || "Diagnostic Risk Evaluation Complete";

    const targetStr = data.primary_disease_target || data.predicted_condition;
    if (targetStr && typeof highlightDomainPill === 'function') {
        highlightDomainPill(targetStr);
    }

    // Risk Factors Tags
    const factorsContainer = document.getElementById('disp_risk_factors_container');
    if (factorsContainer && data.detected_risk_factors) {
        if (data.detected_risk_factors.length > 0) {
            let factorsHtml = '';
            data.detected_risk_factors.forEach(factor => {
                factorsHtml += `<span class="risk-factor-tag">⚠️ ${factor}</span>`;
            });
            factorsContainer.innerHTML = factorsHtml;
        } else {
            factorsContainer.innerHTML = '<span style="font-size: 0.75rem; color: var(--neon-emerald); font-weight: 600;">✓ Optimal physiological parameters</span>';
        }
    }

    // 4. Render 6-Qubit Telemetry & Animate Qubit SVG
    const tel = data.quantum_telemetry || { quantum_probabilities: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5] };
    const features = data.processed_feature_vector || [0, 0, 0, 0, 0, 0];
    const featureLabels = ['Age', 'Sys BP', 'Dia BP', 'Glucose', 'Chol', 'BMI'];

    const qubitContainer = document.getElementById('qubit_telemetry_container');
    if (qubitContainer) {
        let html = '';
        for (let i = 0; i < 6; i++) {
            const prob = tel.quantum_probabilities[i] || 0.5;
            const statusColor = prob > 0.65 ? 'var(--neon-rose)' : (prob > 0.45 ? 'var(--neon-amber)' : 'var(--neon-emerald)');
            html += `
                <div class="qubit-mini-card">
                    <div class="qubit-mini-title">${featureLabels[i]}</div>
                    <div class="qubit-mini-val" style="color: ${statusColor}">${(features[i] * 100).toFixed(0)}</div>
                    <div class="qubit-mini-vqc">VQC: ${(prob * 100).toFixed(1)}%</div>
                </div>
            `;
        }
        qubitContainer.innerHTML = html;
    }

    if (typeof animateQubitSVGVisualizer === 'function') {
        animateQubitSVGVisualizer(tel.quantum_probabilities);
    }

    // Update Analytics Charts
    if (typeof updateAnalyticsCharts === 'function' && data.processed_feature_vector) {
        updateAnalyticsCharts(data.processed_feature_vector);
    }

    // 5. Pinecone Matches
    const pineconeContainer = document.getElementById('pinecone_matches_container');
    if (pineconeContainer && data.pinecone_matches) {
        let html = '';
        data.pinecone_matches.forEach(item => {
            html += `
                <div class="case-card">
                    <span class="case-score-badge">${(item.score * 100).toFixed(1)}% Match</span>
                    <div class="case-condition">${item.metadata.condition || 'Clinical Guideline'}</div>
                    <div class="case-summary">${item.summary}</div>
                </div>
            `;
        });
        pineconeContainer.innerHTML = html;
    }

    // 6. Clinical Report Ledger
    const reportContainer = document.getElementById('report_container');
    if (reportContainer) reportContainer.innerText = data.clinical_summary_report;

    // 7. Multi-Modal Vision & Fusion Badge
    const fusionModeBadge = document.getElementById('disp_fusion_mode');
    if (fusionModeBadge) {
        fusionModeBadge.innerText = data.has_image_input ? 'HYBRID QML + VISION STREAM' : 'TABULAR CLINICAL VITALS STREAM';
    }

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

    const record = {
        id: data.patient_id || `PATIENT-${Math.floor(1000 + Math.random() * 9000)}`,
        date: new Date().toLocaleString(),
        target: data.primary_disease_target || 'General Evaluation',
        condition: data.predicted_condition || 'Diagnostic Risk Assessment',
        risk_tier: data.risk_tier || 'MODERATE RISK',
        risk_score: data.risk_score_percentage || 50.0,
        report: data.clinical_summary_report,
        data: data
    };

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
