import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { GameSettingsComponent } from './game-settings.component';
import { RecentGamesService } from '../recent-games.service';
import { Game, ScoreboardService } from '../scoreboard.service';

const MOCK_GAME: Game = {
  id: 'game-1',
  name: 'Finale',
  teams: [
    { name: 'Lions', color: '#0054e9', score: 3 },
    { name: 'Tigers', color: '#eb445a', score: 1 },
  ],
};

describe('GameSettingsComponent', () => {
  let serviceSpy: jasmine.SpyObj<ScoreboardService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let recentSpy: jasmine.SpyObj<RecentGamesService>;

  function createComponent(gameResult: Game | undefined) {
    serviceSpy = jasmine.createSpyObj<ScoreboardService>('ScoreboardService', [
      'getGameById',
      'updateGameName',
      'updateTeams',
    ]);
    serviceSpy.getGameById.and.returnValue(of(gameResult));
    serviceSpy.updateGameName.and.resolveTo();
    serviceSpy.updateTeams.and.resolveTo();

    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);
    routerSpy.navigate.and.resolveTo(true);

    recentSpy = jasmine.createSpyObj<RecentGamesService>('RecentGamesService', ['track']);
    recentSpy.track.and.resolveTo();

    TestBed.configureTestingModule({
      imports: [GameSettingsComponent],
      providers: [
        { provide: ScoreboardService, useValue: serviceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: RecentGamesService, useValue: recentSpy },
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(convertToParamMap({ id: 'game-1' })) },
        },
      ],
    }).compileComponents();

    return TestBed.createComponent(GameSettingsComponent);
  }

  beforeEach(() => TestBed.resetTestingModule());

  it('should create the component', () => {
    const fixture = createComponent(MOCK_GAME);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should initialise draft fields from loaded game', (done) => {
    const fixture = createComponent(MOCK_GAME);
    const component = fixture.componentInstance;

    component.game$.subscribe(() => {
      expect(component.gameName).toBe('Finale');
      expect(component.teams).toEqual(MOCK_GAME.teams);
      done();
    });
  });

  it('should save game and navigate back to game page', async () => {
    const fixture = createComponent(MOCK_GAME);
    const component = fixture.componentInstance;

    await new Promise<void>((resolve) => component.game$.subscribe(() => resolve()));

    component.gameName = 'Finale modifiee';
    component.teams = [
      { name: 'Lions', color: '#0054e9', score: 3 },
      { name: 'Eagles', color: '#10dc60', score: 1 },
    ];

    await component.saveGame('game-1');

    expect(serviceSpy.updateGameName).toHaveBeenCalledWith('game-1', 'Finale modifiee');
    expect(serviceSpy.updateTeams).toHaveBeenCalledWith('game-1', component.teams);
    expect(recentSpy.track).toHaveBeenCalledWith({
      id: 'game-1',
      name: 'Finale modifiee',
      teams: component.teams,
    });
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/game', 'game-1']);
  });

  it('should save empty name to firebase when gameName is cleared', async () => {
    const fixture = createComponent(MOCK_GAME);
    const component = fixture.componentInstance;

    await new Promise<void>((resolve) => component.game$.subscribe(() => resolve()));

    component.gameName = '';
    component.teams = [
      { name: 'Lions', color: '#0054e9', score: 3 },
      { name: 'Eagles', color: '#10dc60', score: 1 },
    ];

    await component.saveGame('game-1');

    expect(serviceSpy.updateGameName).toHaveBeenCalledWith('game-1', '');
    expect(serviceSpy.updateTeams).toHaveBeenCalledWith('game-1', component.teams);
    expect(recentSpy.track).toHaveBeenCalledWith({
      id: 'game-1',
      name: '',
      teams: component.teams,
    });
  });

  it('should add and remove teams', () => {
    const fixture = createComponent(MOCK_GAME);
    const component = fixture.componentInstance;

    component.teams = [...MOCK_GAME.teams];
    component.addTeam();
    expect(component.teams.length).toBe(3);

    component.removeTeam(1);
    expect(component.teams.length).toBe(2);
  });

  it('should not remove a team when only two remain', () => {
    const fixture = createComponent(MOCK_GAME);
    const component = fixture.componentInstance;

    component.teams = [...MOCK_GAME.teams];
    expect(component.canRemoveTeam()).toBeFalse();

    component.removeTeam(0);

    expect(component.teams).toEqual(MOCK_GAME.teams);
  });
});
