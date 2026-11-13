// frontend/src/components/sortip/IpCategoria.js
// Categoría of an IP (config/sortIpSections.js → IP_CATEGORIAS)
//
//  <IpCategoriaSelect value onChange disabled invalid id />
//     Dropdown: while choosing, each option shows its name + explanation;
//     once chosen, the field shows only the name.
//  <IpCategoriaBadge value />
//     Name only, with an information balloon (ⓘ) that explains the category
//     on hover / keyboard focus. Used by the Data IP list.
//     Its styles (.ip-cat-info) are in IP_CATEGORIA_CSS, added once per page.

import React from 'react';
import {
  CDropdown, CDropdownToggle, CDropdownMenu, CDropdownItem, CDropdownDivider,
  CBadge, CTooltip,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilInfo } from '@coreui/icons';
import { IP_CATEGORIAS, ipCategoria } from '../../config/sortIpSections';

export const IpCategoriaSelect = ({ value = '', onChange, disabled = false, invalid = false, id }) => {
  const legacy = value && !ipCategoria(value); // value from the previous list (Regular, Premium…)
  return (
    <CDropdown className="w-100 ip-cat-dd" variant="dropdown">
      <CDropdownToggle
        id={id}
        disabled={disabled}
        caret={false}
        className={`form-select text-start ip-cat-toggle${invalid ? ' is-invalid' : ''}`}
        aria-label={value ? `Categoría: ${value}` : 'Seleccionar categoría'}
      >
        {value
          ? <>{value}{legacy && <span className="text-muted small ms-1">(categoría anterior)</span>}</>
          : <span className="text-muted">Seleccionar...</span>}
      </CDropdownToggle>
      <CDropdownMenu className="w-100 ip-cat-menu">
        {IP_CATEGORIAS.map(c => (
          <CDropdownItem
            key={c.value} as="button" type="button"
            active={c.value === value}
            onClick={() => onChange(c.value)}
          >
            <span className="fw-semibold">{c.value}</span>
            <span className="ip-cat-desc"> — {c.descripcion}</span>
          </CDropdownItem>
        ))}
        {value && (
          <>
            <CDropdownDivider />
            <CDropdownItem as="button" type="button" className="text-muted small" onClick={() => onChange('')}>
              Quitar categoría
            </CDropdownItem>
          </>
        )}
      </CDropdownMenu>
      <style>{`
        .ip-cat-toggle { width: 100%; background-color: var(--cui-body-bg, #fff); color: var(--cui-body-color); border: var(--cui-border-width, 1px) solid var(--cui-border-color, #d8dbe0); }
        .ip-cat-toggle:disabled { background-color: var(--cui-secondary-bg, #e7eaee); opacity: 1; }
        .ip-cat-menu .dropdown-item { white-space: normal; }
        .ip-cat-menu .ip-cat-desc { color: var(--cui-secondary-color, #6c757d); }
        .ip-cat-menu .dropdown-item.active .ip-cat-desc { color: inherit; opacity: .85; }
      `}</style>
    </CDropdown>
  );
};

export const IP_CATEGORIA_CSS = `
  .ip-cat-info {
    display: inline-flex; align-items: center; justify-content: center;
    width: 18px; height: 18px; border-radius: 50%; cursor: help;
    color: #1ba3b8; background: #e3f5f8;
  }
  .ip-cat-info:focus-visible { outline: 2px solid #1ba3b8; outline-offset: 1px; }
`;

export const IpCategoriaBadge = ({ value }) => {
  if (!value) return null;
  const cat = ipCategoria(value);
  return (
    <span className="d-inline-flex align-items-center gap-1">
      <CBadge color="light" textColor="dark" className="border">{value}</CBadge>
      {cat && (
        <CTooltip content={cat.descripcion} placement="top">
          <span
            tabIndex={0}
            role="img"
            aria-label={`${value}: ${cat.descripcion}`}
            className="ip-cat-info"
            onClick={e => e.stopPropagation()}
          >
            <CIcon icon={cilInfo} size="sm" />
          </span>
        </CTooltip>
      )}
    </span>
  );
};