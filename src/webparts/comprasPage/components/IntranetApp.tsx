import * as React from 'react';
import {
  ChevronRight,
  FileSpreadsheet,
  HelpCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Database,
  Users,
  ArrowRight,
  Activity,
  FolderKanban,
  Home,
  Building2,
  BookOpen,
  Video,
  LayoutGrid,
  FileText,
  ChevronDown,
  ChevronLeft,
  Archive,
  PencilLine,
  Maximize2,
  Minimize2,
  type LucideIcon
} from 'lucide-react';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import { SPPermission } from '@microsoft/sp-page-context';
import { SPHttpClient } from '@microsoft/sp-http';
import logoNRGourmet from '../assets/nr-gourmet-logo.png';
import './IntranetApp.scss';

export interface IIntranetAppProps {
  userDisplayName: string;
  context: WebPartContext;
}

interface IMenuListItem {
  Id: number;
  Title: string;
  URL?: string | { Url?: string; Description?: string };
  Grupo?: string;
  Ordem?: number | string;
  Ativo?: boolean | number | string;
  Icone?: string;
  TipoItem?: 'NavLink' | 'Dropdown' | 'DropdownItem' | string;
}

interface IMenuItem {
  id: number;
  titulo: string;
  url?: string;
  icone: LucideIcon;
  tipo: 'NavLink' | 'Dropdown';
  filhos: IMenuItem[];
  ativo: boolean;
}

const MENU_LIST_TITLE = 'INTRA-Navbar';
const DROPDOWN_HIDE_DELAY_MS = 350;
const LEFT_RAIL_STORAGE_KEY = 'compras:left-rail-hidden';

const normalize = (value: string): string => value.trim().toLowerCase();

const toNumber = (value: number | string | undefined): number => {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value.replace(',', '.'));
    return isNaN(parsed) ? 9999 : parsed;
  }

  return 9999;
};

const isActive = (value: boolean | number | string | undefined): boolean => {
  return value === true || value === 1 || value === '1';
};

const toUrl = (value: string | { Url?: string; Description?: string } | undefined): string => {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value.Url === 'string') {
    return value.Url;
  }

  return '';
};

const iconMap: Record<string, LucideIcon> = {
  home: Home,
  bookopen: BookOpen,
  videotape: Video,
  video: Video,
  building2: Building2,
  layoutgrid: LayoutGrid,
  filetext: FileText,
  folderkanban: FolderKanban,
  database: Database,
  users: Users,
  helpcircle: HelpCircle
};

const defaultMenuItems: IMenuItem[] = [
  { id: 1, titulo: 'Início', url: '#', icone: Home, tipo: 'NavLink', filhos: [], ativo: false },
  { id: 2, titulo: 'Central de Documentos', url: '#', icone: BookOpen, tipo: 'NavLink', filhos: [], ativo: false },
  { id: 3, titulo: 'Videoteca', url: '#', icone: Video, tipo: 'NavLink', filhos: [], ativo: false },
  { id: 4, titulo: 'Setores', url: '#', icone: Building2, tipo: 'Dropdown', filhos: [], ativo: false },
  { id: 5, titulo: 'Formulários', url: '#', icone: FileText, tipo: 'Dropdown', filhos: [], ativo: false }
];

const normalizeUrl = (url: string | undefined, webUrl: string): string => {
  if (!url) {
    return '#';
  }

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  if (url.charAt(0) === '/') {
    return url;
  }

  return `${webUrl.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
};

const isCurrentPath = (url: string | undefined, currentPath: string, webUrl: string): boolean => {
  if (!url || url === '#') {
    return false;
  }

  try {
    const normalizedUrl = new URL(normalizeUrl(url, webUrl), window.location.origin);
    return normalizedUrl.pathname.toLowerCase() === currentPath.toLowerCase();
  } catch {
    return false;
  }
};

const mapIcon = (iconName?: string): LucideIcon => {
  if (!iconName) {
    return LayoutGrid;
  }

  return iconMap[normalize(iconName)] || LayoutGrid;
};

const buildMenuItems = (items: IMenuListItem[], webUrl: string, currentPath: string): IMenuItem[] => {
  const activeItems = items
    .filter(item => isActive(item.Ativo))
    .sort((left, right) => toNumber(left.Ordem) - toNumber(right.Ordem));

  const childrenByGroup = new Map<string, IMenuItem[]>();

  activeItems
    .filter(item => item.TipoItem === 'DropdownItem')
    .forEach(item => {
      const groupKey = item.Grupo || '';
      const childRawUrl = toUrl(item.URL);
      const child: IMenuItem = {
        id: item.Id,
        titulo: item.Title,
        url: normalizeUrl(childRawUrl || '#', webUrl),
        icone: mapIcon(item.Icone),
        tipo: 'NavLink',
        filhos: [],
        ativo: isCurrentPath(childRawUrl, currentPath, webUrl)
      };

      const currentChildren = childrenByGroup.get(groupKey) || [];
      currentChildren.push(child);
      childrenByGroup.set(groupKey, currentChildren);
    });

  return activeItems
    .filter(item => item.TipoItem === 'NavLink' || item.TipoItem === 'Dropdown')
    .map(item => {
      const topLevelRawUrl = toUrl(item.URL);
      const filhos = item.TipoItem === 'Dropdown' ? (childrenByGroup.get(item.Title) || []) : [];
      const ativo = item.TipoItem === 'Dropdown'
        ? filhos.some(filho => filho.ativo)
        : isCurrentPath(topLevelRawUrl, currentPath, webUrl);

      return {
        id: item.Id,
        titulo: item.Title,
        url: normalizeUrl(topLevelRawUrl || '#', webUrl),
        icone: mapIcon(item.Icone),
        tipo: item.TipoItem === 'Dropdown' ? 'Dropdown' : 'NavLink',
        filhos,
        ativo
      };
    });
};

const navegarPara = (url: string): void => {
  window.location.href = url;
};

const PAGE_EDIT_SELECTORS = [
  '#spCommandBar button[name="Editar"]',
  '#spCommandBar button[name="Edit"]',
  '#spCommandBar button[aria-label="Editar"]',
  '#spCommandBar button[aria-label="Edit"]',
  '#spCommandBar [data-automation-id="pageEditMode"]',
  '#spCommandBar [data-automation-id="editPageCommand"]'
] as const;

const IntranetApp: React.FC<IIntranetAppProps> = ({ context }) => {
  const [menuItens, setMenuItens] = React.useState<IMenuItem[]>(defaultMenuItems);
  const [menuError, setMenuError] = React.useState<string>('');
  const [openDropdownId, setOpenDropdownId] = React.useState<number | null>(null);
  const [podeEditar, setPodeEditar] = React.useState<boolean>(false);
  const [leftRailHidden, setLeftRailHidden] = React.useState<boolean>(() => {
    try {
      const saved = window.localStorage.getItem(LEFT_RAIL_STORAGE_KEY);
      if (saved === '0') {
        return false;
      }

      if (saved === '1') {
        return true;
      }
    } catch {
      // Ignore storage access errors and keep default behavior.
    }

    return true;
  });
  const hideDropdownTimeoutRef = React.useRef<number | null>(null);

  const siteUrl = context.pageContext.web.absoluteUrl;
  const homeUrl = siteUrl;

  const findPageEditCommand = React.useCallback((): HTMLElement | null => {
    for (const selector of PAGE_EDIT_SELECTORS) {
      const element = document.querySelector(selector);
      if (!(element instanceof HTMLElement)) {
        continue;
      }

      const searchable = `${element.getAttribute('name') || ''} ${element.getAttribute('aria-label') || ''} ${element.textContent || ''}`.toLowerCase();
      if (searchable.indexOf('navega') !== -1) {
        continue;
      }

      return element;
    }

    return null;
  }, []);

  React.useEffect(() => {
    const syncPodeEditar = (): void => {
      const editCommand = findPageEditCommand();
      if (editCommand) {
        setPodeEditar(true);
        return;
      }

      try {
        setPodeEditar(context.pageContext.web.permissions.hasPermission(SPPermission.addAndCustomizePages));
      } catch {
        setPodeEditar(false);
      }
    };

    syncPodeEditar();
    const retries = [500, 1500, 3000].map(delay => window.setTimeout(syncPodeEditar, delay));

    return () => {
      retries.forEach(id => window.clearTimeout(id));
    };
  }, [context, findPageEditCommand]);

  const onEditarPagina = (): void => {
    const editCommand = findPageEditCommand();
    if (editCommand) {
      editCommand.click();
      return;
    }

    // Fallback: navega para o modo de edição via URL
    const editUrl = new URL(window.location.href);
    editUrl.searchParams.set('Mode', 'Edit');
    window.location.href = editUrl.toString();
  };

  const toggleLeftRail = React.useCallback((): void => {
    setLeftRailHidden(prev => !prev);
  }, []);

  React.useEffect(() => {
    return () => {
      if (hideDropdownTimeoutRef.current !== null) {
        window.clearTimeout(hideDropdownTimeoutRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    document.body.classList.toggle('compras-left-rail-hidden', leftRailHidden);

    try {
      window.localStorage.setItem(LEFT_RAIL_STORAGE_KEY, leftRailHidden ? '1' : '0');
    } catch {
      // Ignore storage access errors.
    }

    return () => {
      document.body.classList.remove('compras-left-rail-hidden');
    };
  }, [leftRailHidden]);

  const openDropdown = (dropdownId: number): void => {
    if (hideDropdownTimeoutRef.current !== null) {
      window.clearTimeout(hideDropdownTimeoutRef.current);
      hideDropdownTimeoutRef.current = null;
    }

    setOpenDropdownId(dropdownId);
  };

  const closeDropdownWithDelay = (): void => {
    if (hideDropdownTimeoutRef.current !== null) {
      window.clearTimeout(hideDropdownTimeoutRef.current);
    }

    hideDropdownTimeoutRef.current = window.setTimeout(() => {
      setOpenDropdownId(null);
      hideDropdownTimeoutRef.current = null;
    }, DROPDOWN_HIDE_DELAY_MS);
  };

  React.useEffect(() => {
    const loadMenu = async (): Promise<void> => {
      try {
        const webUrl = context.pageContext.web.absoluteUrl;
        const apiUrl = `${webUrl}/_api/web/lists/getByTitle('${MENU_LIST_TITLE}')/items?$select=Id,Title,URL,Grupo,Ordem,Ativo,Icone,TipoItem&$orderby=Ordem asc`;
        const response = await context.spHttpClient.get(apiUrl, SPHttpClient.configurations.v1);

        if (!response.ok) {
          throw new Error(`Falha ao carregar menu: ${response.status}`);
        }

        const data = await response.json() as { value: IMenuListItem[] };
        const currentPath = window.location.pathname;
        const mappedItems = buildMenuItems(data.value || [], webUrl, currentPath);

        if (mappedItems.length > 0) {
          setMenuItens(mappedItems);
          setMenuError('');
        }
      } catch (error) {
        setMenuError(error instanceof Error ? error.message : 'Falha ao carregar o menu');
      }
    };

    void loadMenu();
  }, [context]);

  const basesDeDados = [
    {
      id: 1,
      titulo: 'Solicitações de Compras',
      descricao: 'Painel com todas as Ordens de Compra (OCs), status de aprovação e histórico detalhado.',
      icone: FolderKanban,
      cor: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'group-hover:border-blue-300',
      shadow: 'group-hover:shadow-blue-500/10',
      registros: '1.248',
      ultimaAtualizacao: 'Hoje, 10:30'
    },
    {
      id: 2,
      titulo: 'Responsáveis por Categoria',
      descricao: 'Matriz operacional de compradores e analistas responsáveis por cada categoria.',
      icone: Users,
      cor: 'text-indigo-600',
      bg: 'bg-indigo-50',
      border: 'group-hover:border-indigo-300',
      shadow: 'group-hover:shadow-indigo-500/10',
      registros: '42',
      ultimaAtualizacao: 'Há 2 dias'
    },
    {
      id: 3,
      titulo: 'Contratos e Fornecedores',
      descricao: 'Base restrita com SLAs, tabelas de preços e contatos de fornecedores homologados.',
      icone: Database,
      cor: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'group-hover:border-emerald-300',
      shadow: 'group-hover:shadow-emerald-500/10',
      registros: '315',
      ultimaAtualizacao: 'Semana passada'
    },
    {
      id: 4,
      titulo: 'Catálogo de Produtos',
      descricao: 'Listagem padronizada de SKUs, descrições técnicas e códigos internos para requisições.',
      icone: LayoutGrid,
      cor: 'text-rose-600',
      bg: 'bg-rose-50',
      border: 'group-hover:border-rose-300',
      shadow: 'group-hover:shadow-rose-500/10',
      registros: '8.450',
      ultimaAtualizacao: 'Há 1 hora'
    }
  ];

  const minhasAtividades = [
    { oc: '37264', status: 'Pendente', tempo: 'Há 2h', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
    { oc: '37076', status: 'Em Análise', tempo: 'Ontem', icon: AlertCircle, color: 'text-blue-500', bg: 'bg-blue-50' },
    { oc: '37102', status: 'Aprovado', tempo: '10 Mar', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' }
  ];

  return (
    <div className="compras-page min-h-screen bg-slate-50 font-sans text-slate-800">
      <div className="navbarHost">
        <nav className="navigationWrapper">
          <div className="logo" onClick={() => navegarPara(homeUrl)}>
            <img src={logoNRGourmet} alt="NR Gourmet" className="logoImage" />
            <div className="logoText">
              <span className="logoTitle">NR GOURMET</span>
              <span className="logoSubtitle">Intranet</span>
            </div>
          </div>

          <div className="navigation">
            <ul>
              {menuItens.map((item) => {
                const Icone = item.icone;

                if (item.tipo === 'Dropdown') {
                  return (
                    <li
                      key={item.id}
                      className="dropdownMenu"
                      onMouseEnter={() => openDropdown(item.id)}
                      onMouseLeave={closeDropdownWithDelay}
                    >
                      <button className={openDropdownId === item.id || item.ativo ? 'active' : ''}>
                        <Icone size={14} />
                        <span>{item.titulo}</span>
                        <ChevronDown
                          size={14}
                          className={openDropdownId === item.id ? 'chevronUp' : 'chevronDown'}
                        />
                      </button>

                      {openDropdownId === item.id && item.filhos.length > 0 && (
                        <div className="dropdownContent">
                          {item.filhos.map(filho => (
                            <a
                              key={filho.id}
                              href={filho.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              data-interception="off"
                            >
                              {filho.titulo}
                            </a>
                          ))}
                        </div>
                      )}
                    </li>
                  );
                }

                return (
                  <li key={item.id}>
                    <button
                      className={item.ativo ? 'active' : ''}
                      onClick={() => item.url && navegarPara(item.url)}
                    >
                      <Icone size={14} />
                      <span>{item.titulo}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="navbarActions">
            {podeEditar && (
              <button type="button" className="navbarActionBtn navbarEditBtn" onClick={onEditarPagina}>
                <PencilLine size={14} />
                <span>Editar</span>
              </button>
            )}
            <button
              type="button"
              className="navbarActionBtn navbarToggleBtn"
              onClick={toggleLeftRail}
              title={leftRailHidden ? 'Mostrar menu lateral' : 'Ocultar menu lateral'}
              aria-label={leftRailHidden ? 'Mostrar menu lateral' : 'Ocultar menu lateral'}
            >
              {leftRailHidden ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
            </button>
          </div>
        </nav>
        {menuError && (
          <div className="compras-page-menu-feedback">{menuError}</div>
        )}
      </div>

      <main className="w-full px-4 md:px-8 lg:px-10 2xl:px-14 py-8">
        <header className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-sm text-slate-500 mb-3 font-medium">
              <span className="hover:text-blue-600 cursor-pointer transition-colors px-2 py-1 rounded-md hover:bg-blue-50">Setores</span>
              <ChevronRight size={14} className="opacity-50" />
              <span className="text-blue-700 bg-blue-100/50 border border-blue-200 px-3 py-1 rounded-lg font-semibold">Compras</span>
            </div>
            <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">Central de Compras</h2>
          </div>

          <div className="flex space-x-3">
            <button title="Voltar" aria-label="Voltar" className="flex items-center justify-center p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-800 hover:shadow-sm transition-all shadow-sm">
              <ChevronLeft size={20} />
            </button>
            <div className="text-right flex flex-col justify-center">
              <p className="text-sm font-bold text-slate-800">Visualização de Setor</p>
              <p className="text-xs text-slate-500">Acesso padrão liberado</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          <section className="lg:col-span-2 xl:col-span-3 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <button className="group relative bg-gradient-to-br from-[#0f2847] via-[#1e3a8a] to-[#162e66] p-6 rounded-2xl shadow-lg hover:shadow-blue-900/20 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-40 overflow-hidden text-left border border-[#1e3a8a]">
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:bg-cyan-400/20 transition-colors duration-500" />
                <div className="flex justify-between items-start z-10">
                  <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 backdrop-blur-md text-cyan-300 group-hover:scale-110 transition-transform duration-300">
                    <Archive size={28} />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 group-hover:text-white transition-colors">
                    <ArrowRight size={18} className="group-hover:-rotate-45 transition-transform" />
                  </div>
                </div>
                <div className="z-10 mt-4">
                  <h3 className="font-bold text-xl text-white tracking-wide">Central de Arquivos</h3>
                  <p className="text-sm text-blue-200 mt-1 font-medium">Repositório interno do setor</p>
                </div>
              </button>

              <button className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-slate-200 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-40 text-left">
                <div className="w-14 h-14 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 text-blue-600 group-hover:scale-110 group-hover:bg-blue-50 transition-all duration-300">
                  <FileSpreadsheet size={28} />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-slate-800">Procedimentos</h3>
                  <p className="text-sm text-slate-500 mt-1">Manuais e POPs oficiais</p>
                </div>
              </button>

              <button className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-slate-200 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-40 text-left">
                <div className="w-14 h-14 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 text-emerald-600 group-hover:scale-110 group-hover:bg-emerald-50 transition-all duration-300">
                  <HelpCircle size={28} />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-slate-800">Como Solicitar?</h3>
                  <p className="text-sm text-slate-500 mt-1">Central de Ajuda e Suporte</p>
                </div>
              </button>
            </div>

            <div>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-extrabold text-slate-800 flex items-center tracking-tight">
                  <Database size={22} className="mr-2 text-slate-400" />
                  Bases de Dados Disponíveis
                </h3>
                <button className="text-sm font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors">
                  Ver todas
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-5">
                {basesDeDados.map((lista) => {
                  const Icone = lista.icone;
                  return (
                    <div
                      key={lista.id}
                      className={`bg-white border border-slate-200 rounded-2xl p-6 hover:-translate-y-1 transition-all duration-300 cursor-pointer group shadow-sm ${lista.shadow} ${lista.border}`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${lista.bg} ${lista.cor}`}>
                            <Icone size={24} />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800 text-lg group-hover:text-blue-700 transition-colors">{lista.titulo}</h4>
                            <div className="flex items-center text-xs font-semibold text-slate-400 mt-1">
                              <span className="flex items-center bg-slate-100 px-2 py-0.5 rounded-md text-slate-600 mr-2">
                                <Database size={12} className="mr-1" /> {lista.registros}
                              </span>
                              <span>Atualizado {lista.ultimaAtualizacao}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <p className="text-sm text-slate-500 leading-relaxed border-t border-slate-50 pt-4">{lista.descricao}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <aside className="lg:col-span-1 xl:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-blue-600" />
              <h3 className="text-sm font-extrabold text-slate-800 mb-5 flex items-center uppercase tracking-wider">
                <Activity size={18} className="mr-2 text-blue-600" />
                Minhas Atividades
              </h3>

              <div className="space-y-4">
                {minhasAtividades.map((item, idx) => {
                  const StatusIcon = item.icon;
                  return (
                    <div key={idx} className="flex items-center p-3 bg-slate-50/50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer border border-slate-100 group">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 shrink-0 ${item.bg} ${item.color} group-hover:scale-110 transition-transform`}>
                        <StatusIcon size={16} />
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">OC #{item.oc}</p>
                        <p className="text-[11px] font-semibold text-slate-500 truncate uppercase tracking-wide">{item.status}</p>
                      </div>
                      <div className="text-[11px] font-bold text-slate-400 whitespace-nowrap bg-white border border-slate-200 px-2 py-1 rounded-md shadow-sm">
                        {item.tempo}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-indigo-600" />
              <h3 className="text-sm font-extrabold text-slate-800 mb-6 flex items-center uppercase tracking-wider">
                <Users size={18} className="mr-2 text-indigo-600" />
                Equipe do Setor
              </h3>

              <div className="pt-2 pl-2">
                <div className="flex items-start mb-6 relative">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-slate-800 text-white flex items-center justify-center text-sm font-bold z-10 relative ring-4 ring-white shadow-md">
                      CM
                    </div>
                    <div className="absolute top-12 left-1/2 w-0.5 h-20 bg-slate-200 -translate-x-1/2 rounded-full" />
                  </div>
                  <div className="ml-4 pt-1.5">
                    <p className="text-sm font-extrabold text-slate-800 leading-tight">Carlos Mendes</p>
                    <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-wide mt-0.5">Gerente de Suprimentos</p>
                  </div>
                </div>

                <div className="ml-6 relative">
                  <div className="flex items-start mb-5 relative">
                    <div className="absolute -left-6 top-6 w-6 h-0.5 bg-slate-200 rounded-full" />
                    <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold z-10 relative ring-4 ring-white shadow-sm border border-blue-200">
                      GO
                    </div>
                    <div className="ml-4 pt-1.5">
                      <p className="text-sm font-extrabold text-slate-800 leading-tight">Gabriel Oliveira</p>
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mt-0.5">Analista de Processos</p>
                    </div>
                  </div>

                  <div className="flex items-start relative">
                    <div className="absolute -left-6 top-6 w-6 h-0.5 bg-slate-200 rounded-full" />
                    <div className="absolute -left-7 top-6 bottom-0 w-4 bg-white z-0" />
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold z-10 relative ring-4 ring-white shadow-sm border border-emerald-200">
                      AF
                    </div>
                    <div className="ml-4 pt-1.5">
                      <p className="text-sm font-extrabold text-slate-800 leading-tight">Amanda Faria</p>
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mt-0.5">Compradora Pleno</p>
                    </div>
                  </div>
                </div>
              </div>

              <button className="w-full mt-6 py-2.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors uppercase tracking-wider">
                Ver organograma completo
              </button>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default IntranetApp;
