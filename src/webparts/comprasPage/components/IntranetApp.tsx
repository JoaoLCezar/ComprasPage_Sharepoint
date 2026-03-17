import * as React from 'react';
import {
  ChevronRight,
  FileSpreadsheet,
  HelpCircle,
  Users,
  Database,
  ArrowRight,
  FolderKanban,
  Home,
  Building2,
  BookOpen,
  Video,
  LayoutGrid,
  FileText,
  ChevronDown,
  Archive,
  ShoppingCart,
  ExternalLink,
  Download,
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
  context: WebPartContext;
  linksJson: string;
  userDisplayName: string;
}

interface IPageLinks {
  quickAccess: {
    centralArquivos: string;
    procedimentos: string;
    comoSolicitar: string;
  };
  dataBases: {
    verTodas: string;
    responsaveisCategoria: string;
    solicitacoesCompras: string;
    contratosFornecedores: string;
    catalogoProdutos: string;
  };
  sidebar: {
    sistemaGenial: string;
    maisAcessados: {
      politicaCompras2026: string;
      formularioNovoFornecedor: string;
      tabelaSlasCategoria: string;
    };
  };
}

interface IPageLinksOverride {
  quickAccess?: Partial<IPageLinks['quickAccess']>;
  dataBases?: Partial<IPageLinks['dataBases']>;
  sidebar?: {
    sistemaGenial?: string;
    maisAcessados?: Partial<IPageLinks['sidebar']['maisAcessados']>;
  };
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

const buildSiteRelativeUrl = (siteUrl: string, relativePath: string): string => {
  return `${siteUrl.replace(/\/$/, '')}/${relativePath.replace(/^\//, '')}`;
};

const buildListAllItemsUrl = (siteUrl: string, listTitle: string): string => {
  return buildSiteRelativeUrl(siteUrl, `Lists/${encodeURIComponent(listTitle)}/AllItems.aspx`);
};

const buildSharedDocumentUrl = (siteUrl: string, ...pathSegments: string[]): string => {
  const encodedPath = ['Shared Documents', ...pathSegments]
    .map(segment => encodeURIComponent(segment))
    .join('/');

  return buildSiteRelativeUrl(siteUrl, encodedPath);
};

const buildDefaultPageLinks = (siteUrl: string): IPageLinks => {
  const pastaArquivosComprasUrl = 'https://nrgourmet.sharepoint.com/sites/intranet/Central%20de%20Documentos/Forms/AllItems.aspx?id=%2Fsites%2Fintranet%2FCentral%20de%20Documentos%2FCompras&viewid=1f5dabfc%2D90f4%2D48d7%2Da2f7%2D73235c4c5b9b';

  return {
    quickAccess: {
      centralArquivos: pastaArquivosComprasUrl,
      procedimentos: buildSharedDocumentUrl(siteUrl, 'Procedimentos'),
      comoSolicitar: buildSharedDocumentUrl(siteUrl, 'Como Solicitar')
    },
    dataBases: {
      verTodas: pastaArquivosComprasUrl,
      solicitacoesCompras: buildListAllItemsUrl(siteUrl, 'Solicitao de Compras'),
      responsaveisCategoria: buildListAllItemsUrl(siteUrl, 'COMResponsaveis_Por_Categoria_De_Compra'),
      contratosFornecedores: buildListAllItemsUrl(siteUrl, 'Contratos e Fornecedores'),
      catalogoProdutos: buildListAllItemsUrl(siteUrl, 'Catálogo de Produtos')
    },
    sidebar: {
      sistemaGenial: 'https://www3.genialnet.com.br/',
      maisAcessados: {
        politicaCompras2026: buildSharedDocumentUrl(siteUrl, 'Política de Compras 2026.pdf'),
        formularioNovoFornecedor: buildSharedDocumentUrl(siteUrl, 'Formulário - Novo Fornecedor.xlsx'),
        tabelaSlasCategoria: buildSharedDocumentUrl(siteUrl, 'Tabela de SLAs por Categoria.pdf')
      }
    }
  };
};

const resolvePageLinks = (siteUrl: string, rawConfig: string | undefined): IPageLinks => {
  const defaults = buildDefaultPageLinks(siteUrl);

  if (!rawConfig || !rawConfig.trim()) {
    return defaults;
  }

  try {
    const overrides = JSON.parse(rawConfig) as IPageLinksOverride;

    return {
      quickAccess: {
        ...defaults.quickAccess,
        ...overrides.quickAccess
      },
      dataBases: {
        ...defaults.dataBases,
        ...overrides.dataBases
      },
      sidebar: {
        sistemaGenial: overrides.sidebar?.sistemaGenial ?? defaults.sidebar.sistemaGenial,
        maisAcessados: {
          ...defaults.sidebar.maisAcessados,
          ...overrides.sidebar?.maisAcessados
        }
      }
    };
  } catch (error) {
    console.warn('Falha ao interpretar linksJson da web part.', error);
    return defaults;
  }
};

const hasDestination = (url: string | undefined): boolean => Boolean(url && url.trim() && url !== '#');

const isExternalUrl = (url: string, siteUrl: string): boolean => {
  try {
    const destination = new URL(url, window.location.origin);
    const site = new URL(siteUrl, window.location.origin);
    return destination.origin !== site.origin;
  } catch {
    return /^https?:\/\//i.test(url);
  }
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

const IntranetApp: React.FC<IIntranetAppProps> = ({ context, linksJson }) => {
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
  const intranetInicioUrl = 'https://nrgourmet.sharepoint.com/sites/intranet/SitePages/Intranet.aspx';
  const pageLinks = resolvePageLinks(siteUrl, linksJson);

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

  const quickAccessCards = [
    {
      id: 1,
      titulo: 'Central de Arquivos',
      descricao: 'Repositório interno do setor',
      url: pageLinks.quickAccess.centralArquivos,
      destaque: true,
      icone: Archive,
      iconWrapperClassName: 'w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 backdrop-blur-md text-cyan-300 group-hover:scale-110 transition-transform duration-300',
      iconColorClassName: 'text-white/50 group-hover:text-white',
      cardClassName: 'group relative bg-gradient-to-br from-[#0f2847] via-[#1e3a8a] to-[#162e66] p-6 rounded-2xl shadow-lg hover:shadow-blue-900/20 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-40 overflow-hidden text-left border border-[#1e3a8a]',
      titleClassName: 'font-bold text-xl text-white tracking-wide',
      descriptionClassName: 'text-sm text-blue-200 mt-1 font-medium'
    },
    {
      id: 2,
      titulo: 'Procedimentos',
      descricao: 'Manuais e POPs oficiais',
      url: pageLinks.quickAccess.procedimentos,
      destaque: false,
      icone: FileSpreadsheet,
      iconWrapperClassName: 'w-14 h-14 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 text-blue-600 group-hover:scale-110 group-hover:bg-blue-50 transition-all duration-300',
      iconColorClassName: '',
      cardClassName: 'group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-slate-200 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-40 text-left',
      titleClassName: 'font-bold text-xl text-slate-800',
      descriptionClassName: 'text-sm text-slate-500 mt-1'
    },
    {
      id: 3,
      titulo: 'Como Solicitar?',
      descricao: 'Central de Ajuda e Suporte',
      url: pageLinks.quickAccess.comoSolicitar,
      destaque: false,
      icone: HelpCircle,
      iconWrapperClassName: 'w-14 h-14 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 text-emerald-600 group-hover:scale-110 group-hover:bg-emerald-50 transition-all duration-300',
      iconColorClassName: '',
      cardClassName: 'group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-slate-200 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-40 text-left',
      titleClassName: 'font-bold text-xl text-slate-800',
      descriptionClassName: 'text-sm text-slate-500 mt-1'
    }
  ];

  const basesDeDados = [
    {
      id: 1,
      titulo: 'Chamados de Compras',
      url: pageLinks.dataBases.solicitacoesCompras,
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
      url: pageLinks.dataBases.responsaveisCategoria,
      descricao: 'Matriz operacional de compradores e analistas responsáveis por cada categoria.',
      icone: Users,
      cor: 'text-indigo-600',
      bg: 'bg-indigo-50',
      border: 'group-hover:border-indigo-300',
      shadow: 'group-hover:shadow-indigo-500/10',
      registros: '42',
      ultimaAtualizacao: 'Há 2 dias'
    }
  ];

  const sistemaGenialUrl = pageLinks.sidebar.sistemaGenial;
  const sistemaGenialDisponivel = hasDestination(sistemaGenialUrl);
  const verTodasBasesUrl = pageLinks.dataBases.verTodas;
  const linksMaisAcessados = [
    { titulo: 'Política de Compras 2026.pdf', url: pageLinks.sidebar.maisAcessados.politicaCompras2026 },
    { titulo: 'Formulário - Novo Fornecedor.xlsx', url: pageLinks.sidebar.maisAcessados.formularioNovoFornecedor },
    { titulo: 'Tabela de SLAs por Categoria.pdf', url: pageLinks.sidebar.maisAcessados.tabelaSlasCategoria }
  ];
  const mostrarItensMaisAcessados = false;

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

                  const Icone = item.icone as React.FC<{ size: number }>;
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
        <header className="mb-8">
          <div className="flex items-center space-x-2 text-sm text-slate-500 mb-3 font-medium">
            <a
              href={intranetInicioUrl}
              data-interception="off"
              className="hover:text-blue-600 transition-colors px-2 py-1 rounded-md hover:bg-blue-50"
              style={{ textDecoration: 'none' }}
            >
              Início
            </a>
            <ChevronRight size={14} className="opacity-50" />
            <span className="text-blue-700 bg-blue-100/50 border border-blue-200 px-3 py-1 rounded-lg font-semibold">Compras</span>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-slate-300 bg-slate-100 px-6 shadow-sm" style={{ paddingTop: '1.6rem', paddingBottom: '1.6rem' }}>
            <div className="absolute left-0 bg-blue-700" style={{ top: '0.85rem', bottom: '0.85rem', width: '0.5rem', borderTopRightRadius: '9999px', borderBottomRightRadius: '9999px' }} />
            <div style={{ paddingRight: '9rem', paddingLeft: '0.25rem' }}>
              <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">Setor de Compras</h2>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed" style={{ maxWidth: '52rem' }}>
                Central de gestao de suprimentos, solicitacoes e diretrizes. Encontre aqui todos os recursos necessarios para as suas requisicoes de forma escalavel.
              </p>
            </div>
            <div className="absolute text-slate-400" style={{ right: '2.25rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.35 }}>
              <ShoppingCart size={84} strokeWidth={1.5} />
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 xl:items-start">
          <section className="xl:col-span-3 space-y-8">
            <div>
              <h3 className="text-xl font-extrabold text-slate-800 mb-5 tracking-tight">Acesso Rápido</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {quickAccessCards.map(card => {
                  const Icone = card.icone;
                  const abrirEmNovaAba = isExternalUrl(card.url, siteUrl);
                  const cardStyle: React.CSSProperties = {
                    textDecoration: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    width: '100%',
                    height: '10rem',
                    position: 'relative'
                  };
                  const conteudo = (
                    <React.Fragment>
                      {card.destaque && (
                        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:bg-cyan-400/20 transition-colors duration-500" />
                      )}
                      <div className="flex justify-between items-start z-10">
                        <div className={card.iconWrapperClassName}>
                          <Icone size={28} />
                        </div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${card.destaque ? 'bg-white/5' : 'bg-slate-50'} ${card.iconColorClassName}`}>
                          <ArrowRight size={18} className="group-hover:-rotate-45 transition-transform" />
                        </div>
                      </div>
                      <div className="z-10 mt-4">
                        <h3 className={card.titleClassName} style={{ margin: 0 }}>{card.titulo}</h3>
                        <p className={card.descriptionClassName} style={{ margin: '0.3rem 0 0 0' }}>{card.descricao}</p>
                      </div>
                    </React.Fragment>
                  );

                  if (abrirEmNovaAba) {
                    return (
                      <a
                        key={card.id}
                        href={card.url}
                        target="_blank"
                        rel="noreferrer"
                        data-interception="off"
                        className={card.cardClassName}
                        style={cardStyle}
                      >
                        {conteudo}
                      </a>
                    );
                  }

                  return (
                    <a
                      key={card.id}
                      href={card.url}
                      data-interception="off"
                      className={card.cardClassName}
                      style={cardStyle}
                    >
                      {conteudo}
                    </a>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-extrabold text-slate-800 flex items-center tracking-tight">
                  <Database size={22} className="mr-2 text-slate-400" />
                  Listas e bases Disponiveis
                </h3>
                <a
                  href={verTodasBasesUrl}
                  data-interception="off"
                  className="text-sm font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors"
                  style={{ textDecoration: 'none' }}
                >
                  Ver todas
                </a>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-5">
                {basesDeDados.map((lista) => {
                  const Icone = lista.icone;
                  const abrirEmNovaAba = isExternalUrl(lista.url, siteUrl);
                  const conteudo = (
                    <React.Fragment>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${lista.bg} ${lista.cor}`}>
                            <Icone size={24} />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800 text-lg group-hover:text-blue-700 transition-colors">{lista.titulo}</h4>
                          </div>
                        </div>
                      </div>

                      <p className="text-sm text-slate-500 leading-relaxed border-t border-slate-50 pt-4">{lista.descricao}</p>
                    </React.Fragment>
                  );

                  if (abrirEmNovaAba) {
                    return (
                      <a
                        key={lista.id}
                        href={lista.url}
                        target="_blank"
                        rel="noreferrer"
                        data-interception="off"
                        className={`bg-white border border-slate-200 rounded-2xl p-6 hover:-translate-y-1 transition-all duration-300 cursor-pointer group shadow-sm ${lista.shadow} ${lista.border}`}
                        style={{ textDecoration: 'none' }}
                      >
                        {conteudo}
                      </a>
                    );
                  }

                  return (
                    <a
                      key={lista.id}
                      href={lista.url}
                      data-interception="off"
                      className={`bg-white border border-slate-200 rounded-2xl p-6 hover:-translate-y-1 transition-all duration-300 cursor-pointer group shadow-sm ${lista.shadow} ${lista.border}`}
                      style={{ textDecoration: 'none' }}
                    >
                      {conteudo}
                    </a>
                  );
                })}
              </div>
            </div>
          </section>

          <aside className="xl:col-span-1 space-y-4" style={{ marginTop: '3.05rem' }}>
            <div
              className="rounded-2xl shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #1e40af 0%, #1d4ed8 100%)',
                padding: '1.05rem 1rem',
                color: '#ffffff',
                minHeight: '208px'
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <h4 className="text-2xl font-extrabold leading-tight" style={{ color: '#ffffff', fontSize: '1.95rem' }}>Sistema Genial</h4>
                <ExternalLink size={16} style={{ opacity: 0.8, color: '#ffffff' }} />
              </div>
              <p className="text-sm mb-5" style={{ color: 'rgba(219, 234, 254, 0.92)', lineHeight: 1.5 }}>
                Acesso oficial a plataforma de gestão e requisições da NR Gourmet.
              </p>
              {sistemaGenialDisponivel ? (
                <a
                  href={sistemaGenialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-interception="off"
                  className="w-full text-center rounded-lg font-bold"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '42px',
                    background: '#ffffff',
                    color: '#1d4ed8',
                    textDecoration: 'none'
                  }}
                >
                  Acessar Genial
                </a>
              ) : (
                <div
                  className="w-full text-center rounded-lg font-bold"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '42px',
                    background: 'rgba(255, 255, 255, 0.26)',
                    color: '#dbeafe'
                  }}
                >
                  Defina a URL do Genial
                </div>
              )}
            </div>

            <div
              style={{
                background: '#ffffff',
                border: '1px solid #d8e0ea',
                borderRadius: '16px',
                boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
                padding: '1.1rem 1.25rem'
              }}
            >
              <h4
                style={{
                  margin: '0 0 0.75rem 0',
                  fontSize: '0.9rem',
                  lineHeight: 1.15,
                  fontWeight: 800,
                  letterSpacing: '0.03em',
                  textTransform: 'uppercase',
                  color: '#0f2747'
                }}
              >
                Mais Acessados
              </h4>
              <div>
                {mostrarItensMaisAcessados && linksMaisAcessados.map(link => (
                  <a
                    key={link.titulo}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-interception="off"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.55rem',
                      textDecoration: 'none',
                      color: '#1f3b63',
                      fontSize: '0.78rem',
                      fontWeight: 500,
                      lineHeight: 1.35,
                      padding: '0.2rem 0',
                      marginBottom: '0.35rem'
                    }}
                  >
                    <Download size={14} color="#97a6bc" strokeWidth={2} />
                    <span>{link.titulo}</span>
                  </a>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>

      <footer
        style={{
          marginTop: '0.5rem',
          borderTop: '1px solid #dbe3ee',
          background: '#ffffff'
        }}
      >
        <div
          className="w-full px-4 md:px-8 lg:px-10 2xl:px-14"
          style={{
            minHeight: '76px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#94a3b8' }}>
            <div
              style={{
                width: '22px',
                height: '22px',
                borderRadius: '9999px',
                border: '1px solid #cbd5e1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.62rem',
                fontWeight: 700
              }}
            >
              NR
            </div>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.03em' }}>NR GOURMET INTRANET</span>
          </div>

          <div style={{ textAlign: 'right', color: '#64748b' }}>
            <p style={{ margin: 0, fontSize: '0.86rem', fontWeight: 600 }}>© 2026 NR Gourmet Corporate</p>
            <p style={{ margin: 0, fontSize: '0.78rem', fontStyle: 'italic' }}>Centro de Excelência - João Cezar</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default IntranetApp;
