import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { GameSettingsComponent } from './game-settings.component';
import { RecentGamesService } from '../recent-games.service';
import { Game, ScoreboardService } from '../scoreboard.service';

const MOCK_GAME: Game = {
  id: 'game-1',
  name: 'Finale',
  teams: { teamA: 'Lions', teamB: 'Tigers' },
  scores: { teamA: 3, teamB: 1 },
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
      expect(component.teamA).toBe('Lions');
      expect(component.teamB).toBe('Tigers');
      done();
    });
  });

  it('should save game and navigate back to game page', async () => {
    const fixture = createComponent(MOCK_GAME);
    const component = fixture.componentInstance;

    await new Promise<void>((resolve) => component.game$.subscribe(() => resolve()));

    component.gameName = 'Finale modifiee';
    component.teamA = 'Lions';
    component.teamB = 'Eagles';

    await component.saveGame('game-1');

    expect(serviceSpy.updateGameName).toHaveBeenCalledWith('game-1', 'Finale modifiee');
    expect(serviceSpy.updateTeams).toHaveBeenCalledWith('game-1', 'Lions', 'Eagles');
    expect(recentSpy.track).toHaveBeenCalledWith({
      id: 'game-1',
      name: 'Finale modifiee',
      teamA: 'Lions',
      teamB: 'Eagles',
    });
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/game', 'game-1']);
  });
});
