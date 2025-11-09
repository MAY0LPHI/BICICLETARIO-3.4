import { ClientesManager } from './cadastros/clientes.js';
import { BicicletasManager } from './cadastros/bicicletas.js';
import { RegistrosManager } from './registros/registros-diarios.js';
import { ConfiguracaoManager } from './configuracao/configuracao.js';
import { Storage } from './shared/storage.js';
import { Debug } from './shared/debug.js';

class App {
    constructor() {
        this.data = {
            clients: [],
            registros: [],
            selectedClientId: null,
            activeTab: 'clientes',
            currentDailyRecords: [],
        };
        
        this.elements = {
            clientesTab: document.getElementById('clientes-tab'),
            registrosDiariosTab: document.getElementById('registros-diarios-tab'),
            configuracaoTab: document.getElementById('configuracao-tab'),
            clientesTabContent: document.getElementById('clientes-tab-content'),
            registrosDiariosTabContent: document.getElementById('registros-diarios-tab-content'),
            configuracaoTabContent: document.getElementById('configuracao-tab-content'),
        };
    }

    async init() {
        await this.loadData();
        
        this.clientesManager = new ClientesManager(this);
        this.bicicletasManager = new BicicletasManager(this);
        this.registrosManager = new RegistrosManager(this);
        this.configuracaoManager = new ConfiguracaoManager(this);
        
        this.clientesManager.renderClientList();
        this.addEventListeners();
        
        this.registrosManager.elements.dailyRecordsDateInput.value = new Date().toISOString().split('T')[0];
        this.registrosManager.renderDailyRecords();
    }

    addEventListeners() {
        this.elements.clientesTab.addEventListener('click', () => this.switchTab('clientes'));
        this.elements.registrosDiariosTab.addEventListener('click', () => this.switchTab('registros-diarios'));
        this.elements.configuracaoTab.addEventListener('click', () => this.switchTab('configuracao'));
    }

    async loadData() {
        const migrated = Storage.migrateOldData();
        if (migrated) {
            this.data.clients = migrated.clients;
            this.data.registros = migrated.registros;
        } else {
            this.data.clients = await Storage.loadClients();
            this.data.registros = await Storage.loadRegistros();
        }
    }

    switchTab(tabName) {
        this.data.activeTab = tabName;
        
        const tabs = {
            clientes: { btn: this.elements.clientesTab, content: this.elements.clientesTabContent },
            'registros-diarios': { btn: this.elements.registrosDiariosTab, content: this.elements.registrosDiariosTabContent },
            'configuracao': { btn: this.elements.configuracaoTab, content: this.elements.configuracaoTabContent },
        };

        Object.values(tabs).forEach(tab => {
            tab.btn.classList.remove('border-blue-500', 'text-blue-600', 'dark:text-blue-400', 'dark:border-blue-400');
            tab.btn.classList.add('border-transparent', 'text-slate-500', 'hover:text-slate-700', 'hover:border-slate-300');
            tab.content.classList.add('hidden');
        });

        const active = tabs[tabName];
        active.btn.classList.add('border-blue-500', 'text-blue-600', 'dark:text-blue-400', 'dark:border-blue-400');
        active.btn.classList.remove('border-transparent', 'text-slate-500', 'hover:text-slate-700', 'hover:border-slate-300');
        active.content.classList.remove('hidden');

        if (tabName === 'registros-diarios') {
            this.registrosManager.renderDailyRecords();
        }
    }

    toggleModal(modalId, show) {
        const modal = document.getElementById(modalId);
        const modalContent = modal.querySelector('.modal-content');
        if (show) {
            modal.classList.remove('hidden');
            setTimeout(() => {
                modal.classList.add('opacity-100');
                modalContent.classList.replace('scale-95', 'scale-100');
            }, 10);
        } else {
            modal.classList.remove('opacity-100');
            modalContent.classList.replace('scale-100', 'scale-95');
            setTimeout(() => { modal.classList.add('hidden'); }, 300);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    Debug.init();
    lucide.createIcons();
    const app = new App();
    app.init();
});
