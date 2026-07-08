import { Component } from '@angular/core';

@Component({
  selector: 'app-scouting-home',
  imports: [],
  templateUrl: './scouting-home.html',
  styleUrl: './scouting-home.css',
})

interface StinkBugStationCount {
  long: string;
  med: string;
  short: string;
  nymph: string;
}

interface StinkBugRecord {
  type: 'stink_bug_knockdown';
  date: string;
  block: string;
  treesPerStation: string;
  stations: string;
  scout: string;
  counts: Record<string, StinkBugStationCount>;
  totalBugs: string;
  bugsPerTree: string;
}

interface FieldScoutingRecord {
  type: 'field_scouting';
  crop: FieldCrop;
  date: string;
  block: string;
  qtyTrees: string;
  scout: string;
  pests: Record<string, string>;
}

interface WaxScaleRecord {
  type: 'wax_scale';
  date: string;
  block: string;
  qtyTrees: string;
  scout: string;
  pests: Record<string, string>;
  totalPests: string;
}

interface TrapScoutingRecord {
  type: 'trap_scouting';
  crop: TrapCrop;
  date: string;
  blockTrap: string;
  scout: string;
  traps: Record<string, string>;
}

type ScoutingRecord =
  | StinkBugRecord
  | FieldScoutingRecord
  | WaxScaleRecord
  | TrapScoutingRecord;

type FieldCrop = 'mac' | 'avo';
type TrapCrop = 'litchi' | 'avocado' | 'macadamia';

export class ScoutingHome {

constructor() {
  
  
}

// --- Helpers ---

function $(sel: string, ctx?: Element | Document): HTMLElement | null {
  return (ctx || document).querySelector(sel);
}

function $$(sel: string, ctx?: Element | Document): HTMLElement[] {
  return Array.from((ctx || document).querySelectorAll(sel));
}

function todayISO(): string {
  const d = new Date();
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
}

function showToast(msg: string): void {
  const t = $('#toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

// --- View navigation ---

function showView(id: string): void {
  $$('.view').forEach((v) => v.classList.remove('active'));
  const target = document.getElementById(id);
  if (target) {
    target.classList.add('active');
    window.scrollTo(0, 0);
  }
}

$$('.nav-card').forEach((btn) => {
  btn.addEventListener('click', () => {
    const target = (btn as HTMLElement).dataset.target;
    if (target) showView(target);
  });
});

$$('.back-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const target = (btn as HTMLElement).dataset.target;
    if (target) showView(target);
  });
});

// --- Set today's date on all date inputs ---

$$('input[type="date"]').forEach((inp) => {
  (inp as HTMLInputElement).value = todayISO();
});

// --- Clear helpers ---

function clearCounts(formEl: HTMLElement): void {
  $$('input[type="number"]', formEl).forEach((inp) => {
    const input = inp as HTMLInputElement;
    if (
      input.id &&
      (input.id.includes('-tps') ||
        input.id.includes('-qty') ||
        input.id.includes('-ns'))
    )
      return;
    input.value = '';
  });

  $$('input[type="text"]', formEl).forEach((inp) => {
    const input = inp as HTMLInputElement;
    if (input.id && input.id.includes('-scout')) return;
    if (input.id && input.id.includes('-block')) {
      input.value = '';
      return;
    }
    if (!input.id) input.value = '';
  });

  $$('select', formEl).forEach((sel) => {
    const select = sel as HTMLSelectElement;
    if (select.id && select.id.includes('-block')) select.selectedIndex = 0;
  });
}

/* ==========================================
   1. STINK BUG KNOCK DOWN
   ========================================== */

const stinkNsSelect = $('#stink-ns') as HTMLSelectElement | null;
const stinkTable = $('#station-table');
const stinkTotal = $('#stink-total');
const stinkPerTree = $('#stink-pertree');

function buildStationRows(): void {
  if (!stinkTable) return;

  // Remove existing rows (keep 5 header cells)
  while (stinkTable.children.length > 5) {
    stinkTable.removeChild(stinkTable.lastChild!);
  }

  const n = parseInt(stinkNsSelect?.value || '10', 10);

  for (let i = 1; i <= n; i++) {
    const label = document.createElement('span');
    label.className = 'station-label';
    label.textContent = 'Stn ' + i;
    stinkTable.appendChild(label);

    const types: string[] = ['long', 'med', 'short', 'nymph'];
    types.forEach((type) => {
      const inp = document.createElement('input');
      inp.type = 'number';
      inp.className = 'station-input';
      inp.inputMode = 'numeric';
      inp.min = '0';
      inp.dataset.type = type;
      inp.addEventListener('input', calcStinkTotals);
      stinkTable.appendChild(inp);
    });
  }
}

function calcStinkTotals(): void {
  const inputs = $$('.station-input') as HTMLInputElement[];
  let sum = 0;
  inputs.forEach((inp) => {
    sum += parseInt(inp.value, 10) || 0;
  });

  const stations = parseInt(stinkNsSelect?.value || '1', 10);
  const tpsEl = $('#stink-tps') as HTMLInputElement | null;
  const tps = parseInt(tpsEl?.value || '1', 10);
  const perTree = sum / (stations * tps);

  if (stinkTotal) stinkTotal.textContent = String(sum);
  if (stinkPerTree) {
    stinkPerTree.textContent =
      perTree % 1 === 0 ? String(perTree) : perTree.toFixed(2);
  }
}

stinkNsSelect?.addEventListener('change', () => {
  buildStationRows();
  calcStinkTotals();
});

$('#stink-tps')?.addEventListener('input', calcStinkTotals);

buildStationRows();

/* ==========================================
   2. FIELD SCOUTING — crop toggle
   ========================================== */

const fieldCropChips = $('#field-crop-chips');
const fieldMac = $('#field-mac');
const fieldAvo = $('#field-avo');
const fieldBlock = $('#field-block') as HTMLSelectElement | null;

const blocksByFieldCrop: Record<FieldCrop, string[]> = {
  mac: ['1A', '1B', '1C', '1D', '2', '2B', '3', '4', '5', '5A', '7', '8'],
  avo: [
    '1+2',
    '3',
    '4+5',
    '8',
    '9+10',
    '11',
    '12',
    '13',
    '14',
    '15',
    '18',
  ],
};

function setFieldCrop(crop: FieldCrop): void {
  if (!fieldCropChips) return;

  $$('.chip', fieldCropChips).forEach((c) => {
    c.classList.toggle(
      'selected',
      (c as HTMLElement).dataset.crop === crop
    );
  });

  if (fieldMac) fieldMac.hidden = crop !== 'mac';
  if (fieldAvo) fieldAvo.hidden = crop !== 'avo';

  if (fieldBlock) {
    fieldBlock.innerHTML = '<option value="">Select block</option>';
    (blocksByFieldCrop[crop] || []).forEach((b) => {
      const opt = document.createElement('option');
      opt.value = b;
      opt.textContent = b;
      fieldBlock.appendChild(opt);
    });
  }
}

fieldCropChips?.addEventListener('click', (e: Event) => {
  const chip = (e.target as HTMLElement).closest('.chip') as HTMLElement | null;
  if (chip?.dataset.crop) {
    setFieldCrop(chip.dataset.crop as FieldCrop);
  }
});

setFieldCrop('mac');

/* ==========================================
   3. WAX SCALE — auto-total
   ========================================== */

const waxTotal = $('#wax-total');

function calcWaxTotal(): void {
  let sum = 0;
  ($$('.wax-count') as HTMLInputElement[]).forEach((inp) => {
    sum += parseInt(inp.value, 10) || 0;
  });
  if (waxTotal) waxTotal.textContent = String(sum);
}

$$('.wax-count').forEach((inp) =>
  inp.addEventListener('input', calcWaxTotal)
);

/* ==========================================
   4. TRAP SCOUTING — crop toggle
   ========================================== */

const trapCropChips = $('#trap-crop-chips');

const trapSections: Record<TrapCrop, HTMLElement | null> = {
  litchi: $('#trap-litchi'),
  avocado: $('#trap-avocado'),
  macadamia: $('#trap-macadamia'),
};

function setTrapCrop(crop: TrapCrop): void {
  if (!trapCropChips) return;

  $$('.chip', trapCropChips).forEach((c) => {
    c.classList.toggle(
      'selected',
      (c as HTMLElement).dataset.crop === crop
    );
  });

  (Object.entries(trapSections) as [TrapCrop, HTMLElement | null][]).forEach(
    ([key, el]) => {
      if (el) el.hidden = key !== crop;
    }
  );
}

trapCropChips?.addEventListener('click', (e: Event) => {
  const chip = (e.target as HTMLElement).closest('.chip') as HTMLElement | null;
  if (chip?.dataset.crop) {
    setTrapCrop(chip.dataset.crop as TrapCrop);
  }
});

setTrapCrop('litchi');

/* ==========================================
   FORM SUBMISSIONS
   ========================================== */

// --- 1. Stink bug save ---
$('#form-stink')?.addEventListener('submit', (e: Event) => {
  e.preventDefault();

  const data: StinkBugRecord = {
    type: 'stink_bug_knockdown',
    date: ($('#stink-date') as HTMLInputElement).value,
    block: ($('#stink-block') as HTMLSelectElement).value,
    treesPerStation: ($('#stink-tps') as HTMLInputElement).value,
    stations: (stinkNsSelect as HTMLSelectElement).value,
    scout: ($('#stink-scout') as HTMLInputElement).value,
    counts: {},
    totalBugs: stinkTotal?.textContent || '0',
    bugsPerTree: stinkPerTree?.textContent || '0',
  };

  const inputs = $$('.station-input') as HTMLInputElement[];
  const cols = 4;
  const rows = inputs.length / cols;
  for (let r = 0; r < rows; r++) {
    data.counts['station_' + (r + 1)] = {
      long: inputs[r * cols + 0].value || '0',
      med: inputs[r * cols + 1].value || '0',
      short: inputs[r * cols + 2].value || '0',
      nymph: inputs[r * cols + 3].value || '0',
    };
  }

  console.log('SAVE stink_bug:', data);
  // TODO: send to your API / store locally
  showToast('Stink bug record saved ✓');
  clearCounts($('#form-stink')!);
  buildStationRows();
  calcStinkTotals();
});

// --- 2. Field scouting save ---
$('#form-field')?.addEventListener('submit', (e: Event) => {
  e.preventDefault();

  const activeChip = $('.chip.selected', fieldCropChips!) as HTMLElement;
  const activeCrop = activeChip.dataset.crop as FieldCrop;

  const data: FieldScoutingRecord = {
    type: 'field_scouting',
    crop: activeCrop,
    date: ($('#field-date') as HTMLInputElement).value,
    block: ($('#field-block') as HTMLSelectElement).value,
    qtyTrees: ($('#field-qty') as HTMLInputElement).value,
    scout: ($('#field-scout') as HTMLInputElement).value,
    pests: {},
  };

  const section = activeCrop === 'mac' ? fieldMac : fieldAvo;
  if (section) {
    $$('.pest-input', section).forEach((inp) => {
      const row = inp.closest('.pest-row');
      const label = row?.querySelector('.pest-name')?.textContent || '';
      data.pests[label] = (inp as HTMLInputElement).value;
    });
  }

  console.log('SAVE field_scouting:', data);
  showToast('Field scouting record saved ✓');
  clearCounts($('#form-field')!);
});

// --- 3. Wax scale save ---
$('#form-wax')?.addEventListener('submit', (e: Event) => {
  e.preventDefault();

  const data: WaxScaleRecord = {
    type: 'wax_scale',
    date: ($('#wax-date') as HTMLInputElement).value,
    block: ($('#wax-block') as HTMLSelectElement).value,
    qtyTrees: ($('#wax-qty') as HTMLInputElement).value,
    scout: ($('#wax-scout') as HTMLInputElement).value,
    pests: {},
    totalPests: waxTotal?.textContent || '0',
  };

  ($$('.wax-count') as HTMLInputElement[]).forEach((inp) => {
    const row = inp.closest('.pest-row');
    const label = row?.querySelector('.pest-name')?.textContent || '';
    data.pests[label] = inp.value || '0';
  });

  console.log('SAVE wax_scale:', data);
  showToast('Wax scale record saved ✓');
  clearCounts($('#form-wax')!);
  calcWaxTotal();
});

// --- 4. Trap scouting save ---
$('#form-trap')?.addEventListener('submit', (e: Event) => {
  e.preventDefault();

  const activeChip = $('.chip.selected', trapCropChips!) as HTMLElement;
  const activeCrop = activeChip.dataset.crop as TrapCrop;
  const section = trapSections[activeCrop];

  const data: TrapScoutingRecord = {
    type: 'trap_scouting',
    crop: activeCrop,
    date: ($('#trap-date') as HTMLInputElement).value,
    blockTrap: ($('#trap-block') as HTMLInputElement).value,
    scout: ($('#trap-scout') as HTMLInputElement).value,
    traps: {},
  };

  if (section) {
    ($$('.trap-count', section) as HTMLInputElement[]).forEach((inp) => {
      data.traps[inp.dataset.pest || ''] = inp.value || '0';
    });
  }

  console.log('SAVE trap_scouting:', data);
  showToast('Trap scouting record saved ✓');

  if (section) {
    ($$('.trap-count', section) as HTMLInputElement[]).forEach((inp) => {
      inp.value = '';
    });
  }
  ($('#trap-block') as HTMLInputElement).value = '';
});


}
