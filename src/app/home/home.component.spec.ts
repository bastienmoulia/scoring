import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { HomeComponent } from './home.component';
import { ScoreboardService } from '../scoreboard.service';

describe('HomeComponent', () => {
  let serviceSpy: jasmine.SpyObj<ScoreboardService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    serviceSpy = jasmine.createSpyObj<ScoreboardService>('ScoreboardService', ['createGame'], {
      defaultGameName: 'Nouvelle partie',
      defaultTeamA: 'Lions',
      defaultTeamB: 'Tigers',
    });
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);
    routerSpy.navigate.and.resolveTo(true);

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        { provide: ScoreboardService, useValue: serviceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should navigate to game page after successful creation', async () => {
    serviceSpy.createGame.and.resolveTo('game-abc');

    const fixture = TestBed.createComponent(HomeComponent);
    await fixture.componentInstance.createGame();

    expect(serviceSpy.createGame).toHaveBeenCalledWith('Nouvelle partie', 'Lions', 'Tigers');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/game', 'game-abc']);
  });

  it('should show error message when creation fails', async () => {
    serviceSpy.createGame.and.rejectWith(new Error('Firestore error'));

    const fixture = TestBed.createComponent(HomeComponent);
    const component = fixture.componentInstance;

    await component.createGame();

    expect(component.createError).toBeTruthy();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('should reset isCreating to false after failed creation', async () => {
    serviceSpy.createGame.and.rejectWith(new Error('Network error'));

    const fixture = TestBed.createComponent(HomeComponent);
    const component = fixture.componentInstance;

    await component.createGame();

    expect(component.isCreating).toBeFalse();
  });

  it('should navigate to game page on joinGame with valid code', async () => {
    const fixture = TestBed.createComponent(HomeComponent);
    const component = fixture.componentInstance;

    component.joinCode = 'xyz789';
    await component.joinGame();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/game', 'xyz789']);
    expect(component.joinError).toBe('');
  });

  it('should set joinError when joining without a code', async () => {
    const fixture = TestBed.createComponent(HomeComponent);
    const component = fixture.componentInstance;

    component.joinCode = '   ';
    await component.joinGame();

    expect(component.joinError).toBeTruthy();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });
});
