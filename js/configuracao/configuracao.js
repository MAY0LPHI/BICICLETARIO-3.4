import { Storage } from '../shared/storage.js';
import { Utils } from '../shared/utils.js';
import { Modals } from '../shared/modals.js';

export class ConfiguracaoManager {
    constructor(app) {
        this.app = app;
        this.elements = {
            themeRadios: document.querySelectorAll('input[name="theme"]'),
            globalSearch: document.getElementById('global-search'),
            globalSearchResults: document.getElementById('global-search-results'),
            importFile: document.getElementById('import-file'),
            importBtn: document.getElementById('import-btn'),
            importStatus: document.getElementById('import-status'),
            exportExcelBtn: document.getElementById('export-excel-btn'),
            exportCsvBtn: document.getElementById('export-csv-config-btn'),
            historicoOrganizado: document.getElementById('historico-organizado'),
            historicoSummary: document.getElementById('historico-summary'),
        };
        this.expandedYears = new Set();
        this.expandedMonths = new Set();
        this.init();
    }

    init() {
        this.addEventListeners();
        this.setupSystemThemeListener();
        this.loadThemePreference();
        this.renderHistoricoOrganizado();
    }

    loadThemePreference() {
        const savedTheme = localStorage.getItem('themePreference') || 'system';
        
        const allRadios = document.querySelectorAll('input[name="theme"]');
        allRadios.forEach(radio => {
            radio.checked = radio.value === savedTheme;
        });
        
        this.updateThemeLabels(savedTheme);
        
        if (savedTheme === 'system') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.applyTheme(prefersDark ? 'dark' : 'light');
        } else {
            this.applyTheme(savedTheme);
        }
    }

    setupSystemThemeListener() {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', (e) => {
            const currentPreference = localStorage.getItem('themePreference');
            if (currentPreference === 'system') {
                this.applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    addEventListeners() {
        this.elements.themeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.handleThemeChange(e.target.value);
                this.updateThemeLabels(e.target.value);
            });
        });

        this.elements.globalSearch.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
            this.handleGlobalSearch(e.target.value);
        });

        this.elements.importFile.addEventListener('change', (e) => {
            this.elements.importBtn.disabled = !e.target.files.length;
        });

        this.elements.importBtn.addEventListener('click', () => this.handleImport());
        this.elements.exportExcelBtn.addEventListener('click', () => this.exportToExcel());
        this.elements.exportCsvBtn.addEventListener('click', () => this.exportToCSV());
    }

    updateThemeLabels(selectedTheme) {
        const labels = document.querySelectorAll('input[name="theme"]').forEach(radio => {
            const label = radio.closest('label');
            if (radio.value === selectedTheme) {
                label.classList.add('bg-blue-50', 'dark:bg-blue-900/30', 'border-blue-500', 'dark:border-blue-400');
                label.classList.remove('border-slate-200', 'dark:border-slate-600');
            } else {
                label.classList.remove('bg-blue-50', 'dark:bg-blue-900/30', 'border-blue-500', 'dark:border-blue-400');
                label.classList.add('border-slate-200', 'dark:border-slate-600');
            }
        });
    }

    handleThemeChange(theme) {
        localStorage.setItem('themePreference', theme);
        
        if (theme === 'system') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.applyTheme(prefersDark ? 'dark' : 'light');
        } else {
            this.applyTheme(theme);
        }
    }

    applyTheme(theme) {
        const htmlElement = document.documentElement;
        const isDark = theme === 'dark';
        
        if (isDark) {
            htmlElement.classList.add('dark');
        } else {
            htmlElement.classList.remove('dark');
        }
        
        localStorage.setItem('theme', theme);
    }

    handleGlobalSearch(query) {
        const resultsContainer = this.elements.globalSearchResults;
        
        if (!query.trim()) {
            resultsContainer.innerHTML = '<p class="text-sm text-slate-500 dark:text-slate-400 text-center py-4">Digite para buscar clientes</p>';
            return;
        }

        const searchTerm = query.toLowerCase();
        const numericSearch = query.replace(/\D/g, '');
        
        const results = this.app.data.clients.filter(client => {
            const name = client.nome.toLowerCase();
            const cpf = client.cpf.replace(/\D/g, '');
            const telefone = client.telefone.replace(/\D/g, '');
            
            const matchesName = name.includes(searchTerm);
            const matchesCPF = numericSearch.length > 0 && cpf.includes(numericSearch);
            const matchesTelefone = numericSearch.length > 0 && telefone.includes(numericSearch);
            
            return matchesName || matchesCPF || matchesTelefone;
        });

        if (results.length === 0) {
            resultsContainer.innerHTML = '<p class="text-sm text-slate-500 dark:text-slate-400 text-center py-4">Nenhum cliente encontrado para "<span class="font-semibold">' + query + '</span>"</p>';
            return;
        }
        
        const resultCountMsg = `<p class="text-xs text-blue-600 dark:text-blue-400 font-medium mb-3">${results.length} cliente(s) encontrado(s)</p>`;

        resultsContainer.innerHTML = resultCountMsg + results.map(client => `
            <div class="p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <div class="cursor-pointer" data-client-id="${client.id}">
                    <p class="font-semibold text-slate-800 dark:text-slate-100">${client.nome}</p>
                    <p class="text-sm text-slate-500 dark:text-slate-400">${Utils.formatCPF(client.cpf)}</p>
                    <p class="text-sm text-slate-500 dark:text-slate-400">${Utils.formatTelefone(client.telefone)}</p>
                </div>
                <div class="mt-2 pt-2 border-t border-slate-200 dark:border-slate-600 flex gap-2">
                    <button class="export-client-pdf-btn flex-1 px-3 py-1.5 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center justify-center gap-1" data-client-id="${client.id}">
                        <i data-lucide="file-text" class="w-3 h-3"></i>
                        Exportar PDF
                    </button>
                    <button class="export-client-excel-btn flex-1 px-3 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center justify-center gap-1" data-client-id="${client.id}">
                        <i data-lucide="file-spreadsheet" class="w-3 h-3"></i>
                        Exportar Excel
                    </button>
                </div>
            </div>
        `).join('');

        resultsContainer.querySelectorAll('[data-client-id]').forEach(el => {
            if (!el.classList.contains('export-client-pdf-btn') && !el.classList.contains('export-client-excel-btn')) {
                el.addEventListener('click', () => {
                    const clientId = el.dataset.clientId;
                    this.app.data.selectedClientId = clientId;
                    this.app.switchTab('clientes');
                    this.app.clientesManager.renderClientDetails(clientId);
                });
            }
        });

        resultsContainer.querySelectorAll('.export-client-pdf-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const clientId = btn.dataset.clientId;
                this.exportClientRecordsToPDF(clientId);
            });
        });

        resultsContainer.querySelectorAll('.export-client-excel-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const clientId = btn.dataset.clientId;
                this.exportClientRecordsToExcel(clientId);
            });
        });

        lucide.createIcons();
    }

    async handleImport() {
        const file = this.elements.importFile.files[0];
        if (!file) return;

        const statusEl = this.elements.importStatus;
        statusEl.classList.remove('hidden');
        statusEl.innerHTML = '<p class="text-blue-600 dark:text-blue-400">Importando...</p>';

        try {
            const data = await this.readFile(file);
            const imported = this.processImportData(data);
            
            if (imported > 0) {
                Storage.saveClients(this.app.data.clients);
                this.app.clientesManager.renderClientList();
                statusEl.innerHTML = `<p class="text-green-600 dark:text-green-400">✓ ${imported} cliente(s) importado(s) com sucesso!</p>`;
                this.elements.importFile.value = '';
                this.elements.importBtn.disabled = true;
            } else {
                statusEl.innerHTML = '<p class="text-yellow-600 dark:text-yellow-400">Nenhum cliente válido encontrado no arquivo.</p>';
            }
        } catch (error) {
            console.error('Erro ao importar:', error);
            statusEl.innerHTML = `<p class="text-red-600 dark:text-red-400">✗ Erro ao importar: ${error.message}</p>`;
        }

        setTimeout(() => {
            statusEl.classList.add('hidden');
        }, 5000);
    }

    sanitizeCsvCell(cell) {
        if (typeof cell !== 'string') return cell;
        
        let sanitized = cell.trim();
        
        if (sanitized.startsWith('"') && sanitized.endsWith('"')) {
            sanitized = sanitized.slice(1, -1);
        }
        
        sanitized = sanitized.replace(/""/g, '"');
        
        return sanitized;
    }

    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            const isCSV = file.name.endsWith('.csv');

            reader.onload = (e) => {
                try {
                    if (isCSV) {
                        const text = e.target.result;
                        const rows = text.split('\n').map(row => 
                            row.split(',').map(cell => this.sanitizeCsvCell(cell))
                        );
                        resolve(rows);
                    } else {
                        const data = new Uint8Array(e.target.result);
                        const workbook = XLSX.read(data, { type: 'array' });
                        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
                        resolve(jsonData);
                    }
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
            
            if (isCSV) {
                reader.readAsText(file);
            } else {
                reader.readAsArrayBuffer(file);
            }
        });
    }

    processImportData(rows) {
        let imported = 0;
        
        rows.forEach((row, index) => {
            if (index === 0 && (row[0]?.toLowerCase().includes('nome') || row[0]?.toLowerCase().includes('name'))) {
                return;
            }

            if (row.length >= 3 && row[0] && row[2]) {
                const nome = String(row[0]).trim();
                const telefoneRaw = String(row[1] || '').trim();
                const telefone = telefoneRaw.replace(/\D/g, '');
                const cpf = String(row[2]).replace(/\D/g, '');

                if (nome && cpf && Utils.validateCPF(cpf)) {
                    const exists = this.app.data.clients.some(c => c.cpf.replace(/\D/g, '') === cpf);
                    
                    if (!exists) {
                        const newClient = {
                            id: Utils.generateUUID(),
                            nome: nome,
                            cpf: cpf,
                            telefone: telefone,
                            bicicletas: []
                        };
                        this.app.data.clients.push(newClient);
                        imported++;
                    }
                }
            }
        });

        return imported;
    }

    exportToExcel() {
        const data = this.prepareExportData();
        
        const ws = XLSX.utils.aoa_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Clientes");
        
        XLSX.writeFile(wb, `clientes_${new Date().toISOString().split('T')[0]}.xlsx`);
    }

    exportToCSV() {
        const data = this.prepareExportData();
        
        const csvContent = data.map(row => 
            row.map(cell => {
                const cellStr = String(cell);
                const escaped = cellStr.replace(/"/g, '""');
                return `"${escaped}"`;
            }).join(',')
        ).join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `clientes_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    prepareExportData() {
        const headers = ['Nome', 'Número', 'CPF'];
        const rows = this.app.data.clients.map(client => [
            client.nome,
            client.telefone ? Utils.formatTelefone(client.telefone) : '',
            Utils.formatCPF(client.cpf)
        ]);
        
        return [headers, ...rows];
    }

    getClientRecords(clientId) {
        const client = this.app.data.clients.find(c => c.id === clientId);
        if (!client) return null;

        const clientRecords = this.app.data.registros.filter(r => r.clientId === clientId);
        
        const recordsWithDetails = clientRecords.map(registro => {
            let bikeModel = 'N/A';
            let bikeBrand = 'N/A';
            let bikeColor = 'N/A';

            if (registro.bikeSnapshot) {
                bikeModel = registro.bikeSnapshot.modelo;
                bikeBrand = registro.bikeSnapshot.marca;
                bikeColor = registro.bikeSnapshot.cor;
            } else {
                const bike = client.bicicletas?.find(b => b.id === registro.bikeId);
                if (bike) {
                    bikeModel = bike.modelo;
                    bikeBrand = bike.marca;
                    bikeColor = bike.cor;
                }
            }

            return {
                ...registro,
                clientName: client.nome,
                clientCPF: client.cpf,
                bikeModel: bikeModel,
                bikeBrand: bikeBrand,
                bikeColor: bikeColor
            };
        });

        recordsWithDetails.sort((a, b) => new Date(b.dataHoraEntrada) - new Date(a.dataHoraEntrada));
        
        return {
            client,
            records: recordsWithDetails
        };
    }

    async exportClientRecordsToPDF(clientId) {
        const data = this.getClientRecords(clientId);
        if (!data || data.records.length === 0) {
            await Modals.showAlert('Nenhum registro de acesso encontrado para este cliente.', 'Atenção');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 14;
        let yPos = margin;

        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.text('Relatório de Registros de Acesso', pageWidth / 2, yPos, { align: 'center' });
        
        yPos += 10;
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth / 2, yPos, { align: 'center' });
        
        yPos += 15;
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('Informações do Cliente', margin, yPos);
        
        yPos += 7;
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`Nome: ${data.client.nome}`, margin + 5, yPos);
        yPos += 5;
        doc.text(`CPF: ${Utils.formatCPF(data.client.cpf)}`, margin + 5, yPos);
        yPos += 5;
        doc.text(`Telefone: ${Utils.formatTelefone(data.client.telefone)}`, margin + 5, yPos);
        yPos += 5;
        doc.text(`Total de Registros: ${data.records.length}`, margin + 5, yPos);

        yPos += 12;
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('Histórico de Registros', margin, yPos);
        
        yPos += 8;

        data.records.forEach((registro, index) => {
            if (yPos > pageHeight - 40) {
                doc.addPage();
                yPos = margin;
            }

            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.text(`Registro #${index + 1}`, margin, yPos);
            
            yPos += 6;
            doc.setFont(undefined, 'normal');
            doc.text(`Bicicleta: ${registro.bikeModel} (${registro.bikeBrand} - ${registro.bikeColor})`, margin + 5, yPos);
            
            yPos += 5;
            const entradaDate = new Date(registro.dataHoraEntrada);
            doc.text(`Entrada: ${entradaDate.toLocaleString('pt-BR')}`, margin + 5, yPos);
            
            yPos += 5;
            if (registro.dataHoraSaida) {
                const saidaDate = new Date(registro.dataHoraSaida);
                const statusText = registro.accessRemoved ? 'Acesso Removido' : 'Saída Normal';
                doc.text(`Saída: ${saidaDate.toLocaleString('pt-BR')} (${statusText})`, margin + 5, yPos);
            } else {
                doc.text('Saída: Ainda no estacionamento', margin + 5, yPos);
            }

            yPos += 8;
            doc.setDrawColor(200, 200, 200);
            doc.line(margin, yPos - 2, pageWidth - margin, yPos - 2);
            yPos += 2;
        });

        doc.save(`registros_${data.client.nome.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
    }

    async exportClientRecordsToExcel(clientId) {
        const data = this.getClientRecords(clientId);
        if (!data || data.records.length === 0) {
            await Modals.showAlert('Nenhum registro de acesso encontrado para este cliente.', 'Atenção');
            return;
        }

        const headers = ['Data/Hora Entrada', 'Data/Hora Saída', 'Status', 'Bicicleta', 'Marca', 'Cor'];
        const rows = data.records.map(registro => {
            const entradaDate = new Date(registro.dataHoraEntrada);
            const saidaDate = registro.dataHoraSaida ? new Date(registro.dataHoraSaida) : null;
            const status = !registro.dataHoraSaida ? 'No estacionamento' : 
                          (registro.accessRemoved ? 'Acesso Removido' : 'Saída Normal');
            
            return [
                entradaDate.toLocaleString('pt-BR'),
                saidaDate ? saidaDate.toLocaleString('pt-BR') : '-',
                status,
                registro.bikeModel,
                registro.bikeBrand,
                registro.bikeColor
            ];
        });

        const clientInfo = [
            ['RELATÓRIO DE REGISTROS DE ACESSO'],
            [],
            ['Cliente:', data.client.nome],
            ['CPF:', Utils.formatCPF(data.client.cpf)],
            ['Telefone:', Utils.formatTelefone(data.client.telefone)],
            ['Total de Registros:', data.records.length],
            ['Gerado em:', new Date().toLocaleString('pt-BR')],
            [],
            headers,
            ...rows
        ];

        const ws = XLSX.utils.aoa_to_sheet(clientInfo);
        
        ws['!cols'] = [
            { wch: 20 },
            { wch: 20 },
            { wch: 18 },
            { wch: 20 },
            { wch: 15 },
            { wch: 12 }
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Registros");
        
        XLSX.writeFile(wb, `registros_${data.client.nome.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
    }

    async renderHistoricoOrganizado() {
        const summary = await Storage.loadStorageSummary();
        const organized = await Storage.getOrganizedRegistros();
        
        if (!summary || summary.totalRegistros === 0) {
            this.elements.historicoOrganizado.innerHTML = '<p class="text-sm text-slate-500 dark:text-slate-400 text-center py-4">Nenhum registro encontrado</p>';
            this.elements.historicoSummary.innerHTML = '';
            return;
        }

        this.elements.historicoSummary.innerHTML = `
            <div class="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-600 dark:text-blue-400"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                <span class="font-semibold text-slate-700 dark:text-slate-200">Total de Registros: ${summary.totalRegistros}</span>
            </div>
        `;

        const years = Object.keys(organized).sort((a, b) => b - a);
        
        this.elements.historicoOrganizado.innerHTML = years.map(year => {
            const yearData = summary.anos[year];
            const isExpanded = this.expandedYears.has(year);
            
            return `
                <div class="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                    <div class="folder-header flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" data-year="${year}">
                        <div class="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-yellow-600 dark:text-yellow-400 transition-transform ${isExpanded ? 'rotate-90' : ''}">
                                <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/>
                            </svg>
                            <span class="font-semibold text-slate-800 dark:text-slate-100">${year}</span>
                            <span class="text-xs text-slate-500 dark:text-slate-400">(${yearData.totalMeses} ${yearData.totalMeses === 1 ? 'mês' : 'meses'})</span>
                        </div>
                        <span class="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full font-medium">
                            ${Object.values(yearData.meses).reduce((sum, m) => sum + m.totalRegistros, 0)} registros
                        </span>
                    </div>
                    <div class="year-content ${isExpanded ? '' : 'hidden'} p-2 space-y-2">
                        ${this.renderMonths(year, organized[year], yearData)}
                    </div>
                </div>
            `;
        }).join('');

        this.attachHistoricoEventListeners();
    }

    renderMonths(year, monthsData, summaryData) {
        const months = Object.keys(monthsData).sort((a, b) => b - a);
        
        return months.map(month => {
            const monthInfo = summaryData.meses[month];
            const isExpanded = this.expandedMonths.has(`${year}-${month}`);
            
            return `
                <div class="border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden">
                    <div class="month-header flex items-center justify-between p-2 bg-white dark:bg-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors" data-year="${year}" data-month="${month}">
                        <div class="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-600 dark:text-blue-400 transition-transform ${isExpanded ? 'rotate-90' : ''}">
                                <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/>
                            </svg>
                            <span class="text-sm font-medium text-slate-700 dark:text-slate-200">${monthInfo.nome}</span>
                            <span class="text-xs text-slate-500 dark:text-slate-400">(${monthInfo.totalDias} ${monthInfo.totalDias === 1 ? 'dia' : 'dias'})</span>
                        </div>
                        <span class="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded-full">
                            ${monthInfo.totalRegistros}
                        </span>
                    </div>
                    <div class="month-content ${isExpanded ? '' : 'hidden'} p-2 pl-6 space-y-1">
                        ${this.renderDays(year, month, monthsData[month], monthInfo)}
                    </div>
                </div>
            `;
        }).join('');
    }

    renderDays(year, month, daysData, monthInfo) {
        const days = Object.keys(daysData).sort((a, b) => b - a);
        
        return days.map(day => {
            const dayCount = monthInfo.dias[day];
            const date = new Date(year, month - 1, day);
            const dayName = date.toLocaleDateString('pt-BR', { weekday: 'long' });
            
            const registrosDay = daysData[day] || [];
            const pernoiteCount = registrosDay.filter(r => r.pernoite === true).length;
            
            return `
                <div class="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900/30 rounded hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors">
                    <div class="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-500 dark:text-slate-400">
                            <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
                            <line x1="16" x2="16" y1="2" y2="6"/>
                            <line x1="8" x2="8" y1="2" y2="6"/>
                            <line x1="3" x2="21" y1="10" y2="10"/>
                        </svg>
                        <span class="text-sm text-slate-700 dark:text-slate-200">${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}</span>
                        <span class="text-xs text-slate-500 dark:text-slate-400 capitalize">(${dayName})</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-xs px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded">
                            ${dayCount} ${dayCount === 1 ? 'registro' : 'registros'}
                        </span>
                        ${pernoiteCount > 0 ? `
                            <span class="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
                                </svg>
                                ${pernoiteCount} ${pernoiteCount === 1 ? 'pernoite' : 'pernoites'}
                            </span>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    attachHistoricoEventListeners() {
        document.querySelectorAll('.folder-header').forEach(header => {
            header.addEventListener('click', (e) => {
                const year = e.currentTarget.dataset.year;
                const content = e.currentTarget.nextElementSibling;
                const icon = e.currentTarget.querySelector('svg');
                
                if (this.expandedYears.has(year)) {
                    this.expandedYears.delete(year);
                    content.classList.add('hidden');
                    icon.classList.remove('rotate-90');
                } else {
                    this.expandedYears.add(year);
                    content.classList.remove('hidden');
                    icon.classList.add('rotate-90');
                }
            });
        });

        document.querySelectorAll('.month-header').forEach(header => {
            header.addEventListener('click', (e) => {
                const year = e.currentTarget.dataset.year;
                const month = e.currentTarget.dataset.month;
                const key = `${year}-${month}`;
                const content = e.currentTarget.nextElementSibling;
                const icon = e.currentTarget.querySelector('svg');
                
                if (this.expandedMonths.has(key)) {
                    this.expandedMonths.delete(key);
                    content.classList.add('hidden');
                    icon.classList.remove('rotate-90');
                } else {
                    this.expandedMonths.add(key);
                    content.classList.remove('hidden');
                    icon.classList.add('rotate-90');
                }
            });
        });
    }
}
