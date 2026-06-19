import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import type { AuthStatus } from '../../../core/auth/auth.models';
import { NavBarComponent } from './nav-bar';

// ─── Helpers ────────────────────────────────────────────────────────────────

function queryAllByClass(el: HTMLElement, cls: string): HTMLElement[] {
  return Array.from(el.querySelectorAll(`.${cls}`));
}

function queryAllAnchors(el: HTMLElement): HTMLAnchorElement[] {
  return Array.from(el.querySelectorAll('a'));
}

function getAnchorByText(el: HTMLElement, text: string): HTMLAnchorElement | undefined {
  return queryAllAnchors(el).find((a) => a.textContent?.trim() === text);
}

function getButtonByText(el: HTMLElement, text: string): HTMLButtonElement | undefined {
  return Array.from(el.querySelectorAll('button')).find(
    (btn) => btn.textContent?.trim() === text,
  ) as HTMLButtonElement | undefined;
}

// ─── Shared mock setup ──────────────────────────────────────────────────────

const statusSignal = signal<AuthStatus>('anonymous');
const userSignal = signal<{ displayName: string } | null>(null);

const mockAuthService = {
  status: statusSignal.asReadonly(),
  user: userSignal.asReadonly(),
  logout: vi.fn().mockReturnValue({ subscribe: vi.fn() }),
};

async function setup(): Promise<{ fixture: ComponentFixture<NavBarComponent>; el: HTMLElement }> {
  await TestBed.configureTestingModule({
    imports: [NavBarComponent],
    providers: [
      provideRouter([]),
      { provide: AuthService, useValue: mockAuthService },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(NavBarComponent);
  const el = fixture.nativeElement as HTMLElement;
  return { fixture, el };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. anonymous state
// ═══════════════════════════════════════════════════════════════════════════

describe('NavBarComponent – anonymous state', () => {
  let fixture: ComponentFixture<NavBarComponent>;
  let el: HTMLElement;

  beforeEach(async () => {
    statusSignal.set('anonymous');
    userSignal.set(null);
    ({ fixture, el } = await setup());
    fixture.detectChanges();
  });

  afterEach(() => TestBed.resetTestingModule());

  it('renders a "Login" link', () => {
    const link = getAnchorByText(el, 'Login');
    expect(link).toBeTruthy();
  });

  it('renders a "Sign Up" link', () => {
    const link = getAnchorByText(el, 'Sign Up');
    expect(link).toBeTruthy();
  });

  it('does NOT render a "Sign Out" button', () => {
    const btn = getButtonByText(el, 'Sign Out');
    expect(btn).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. authenticated state
// ═══════════════════════════════════════════════════════════════════════════

describe('NavBarComponent – authenticated state', () => {
  let fixture: ComponentFixture<NavBarComponent>;
  let el: HTMLElement;

  beforeEach(async () => {
    statusSignal.set('authenticated');
    userSignal.set({ displayName: 'Alice' });
    ({ fixture, el } = await setup());
    fixture.detectChanges();
  });

  afterEach(() => TestBed.resetTestingModule());

  it('renders a "Sign Out" button', () => {
    const btn = getButtonByText(el, 'Sign Out');
    expect(btn).toBeTruthy();
  });

  it('renders avatar with the first letter of the display name', () => {
    const avatarSpan = el.querySelector('div span') as HTMLSpanElement | null;
    expect(avatarSpan).toBeTruthy();
    expect(avatarSpan!.textContent?.trim()).toBe('A');
  });

  it('does NOT render "Login" or "Sign Up" links', () => {
    expect(getAnchorByText(el, 'Login')).toBeUndefined();
    expect(getAnchorByText(el, 'Sign Up')).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. checking state
// ═══════════════════════════════════════════════════════════════════════════

describe('NavBarComponent – checking state', () => {
  let fixture: ComponentFixture<NavBarComponent>;
  let el: HTMLElement;

  beforeEach(async () => {
    statusSignal.set('checking');
    userSignal.set(null);
    ({ fixture, el } = await setup());
    fixture.detectChanges();
  });

  afterEach(() => TestBed.resetTestingModule());

  it('renders skeleton elements with animate-pulse class', () => {
    const skeletons = queryAllByClass(el, 'animate-pulse');
    expect(skeletons.length).toBeGreaterThanOrEqual(1);
  });

  it('does NOT render "Login", "Sign Up", or "Sign Out"', () => {
    expect(getAnchorByText(el, 'Login')).toBeUndefined();
    expect(getAnchorByText(el, 'Sign Up')).toBeUndefined();
    expect(getButtonByText(el, 'Sign Out')).toBeUndefined();
  });
});
