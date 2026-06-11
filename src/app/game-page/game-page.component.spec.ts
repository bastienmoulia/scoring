import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { GamePageComponent } from './game-page.component';
import { Game, ScoreboardService } from '../scoreboard.service';
import { RecentGamesService } from '../recent-games.service';

const MOCK_GAME: Game = {
  id: 'game-1',
  name: 'Finale',
  teams: { teamA: 'Lions', teamB: 'Tigers' },
  scores: { teamA: 3, teamB: 1 },
};

describe('GamePageComponent', () => {
  let serviceSpy: jasmine.SpyObj<ScoreboardService>;
  let routerSpy: jasmine.SpyObj<Router>;

  function createComponent(gameResult: Game | undefined) {
    serviceSpy = jasmine.createSpyObj<ScoreboardService>('ScoreboardService', [
      'getGameById',
      'updateGameName',
      'updateTeams',
      'updateScore',
    ]);
    serviceSpy.getGameById.and.returnValue(of(gameResult));
    serviceSpy.updateGameName.and.resolveTo();
    serviceSpy.updateTeams.and.resolveTo();
    serviceSpy.updateScore.and.resolveTo();

    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);
    routerSpy.navigate.and.resolveTo(true);

    const recentSpy = jasmine.createSpyObj<RecentGamesService>('RecentGamesService', ['track', 'remove', 'getAll']);
    recentSpy.track.and.resolveTo();
    recentSpy.remove.and.resolveTo();
    recentSpy.getAll.and.resolveTo([]);

    TestBed.configureTestingModule({
      imports: [GamePageComponent],
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

    return TestBed.createComponent(GamePageComponent);
  }

  beforeEach(() => TestBed.resetTestingModule());

  it('should create the component', () => {
    const fixture = createComponent(MOCK_GAME);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should initialise draft fields from the loaded game', (done) => {
    const fixture = createComponent(MOCK_GAME);
    const component = fixture.componentInstance;

    component.game$.subscribe(() => {
      expect(component.gameName).toBe('Finale');
      expect(component.teamA).toBe('Lions');
      expect(component.teamB).toBe('Tigers');
      done();
    });
  });

  it('should not reinitialise draft fields when the same game emits again', (done) => {
    const fixture = createComponent(MOCK_GAME);
    const component = fixture.componentInstance;

    component.game$.subscribe(({ game }) => {
      component.gameName = 'Modifié par utilisateur';

      component.game$.subscribe(({ game: game2 }) => {
        expect(component.gameName).toBe('Modifié par utilisateur');
        done();
      });
    });
  });

  it('should call updateGameName and updateTeams on saveGame', async () => {
    const fixture = createComponent(MOCK_GAME);
    const component = fixture.componentInstance;

    await new Promise<void>((resolve) => component.game$.subscribe(() => resolve()));

    await component.saveGame('game-1');

    expect(serviceSpy.updateGameName).toHaveBeenCalledWith('game-1', 'Finale');
    expect(serviceSpy.updateTeams).toHaveBeenCalledWith('game-1', 'Lions', 'Tigers');
  });

  it('should update recent games after saveGame', async () => {
    const fixture = createComponent(MOCK_GAME);
    const component = fixture.componentInstance;

    await new Promise<void>((resolve) => component.game$.subscribe(() => resolve()));

    component.gameName = 'Finale modifiée';
    component.teamA = 'Lions';
    component.teamB = 'Eagles';

    await component.saveGame('game-1');

    const recentSpy = TestBed.inject(RecentGamesService) as jasmine.SpyObj<RecentGamesService>;
    expect(recentSpy.track).toHaveBeenCalledWith({
      id: 'game-1',
      name: 'Finale modifiée',
      teamA: 'Lions',
      teamB: 'Eagles',
    });
  });

  it('should not call save when fields are empty', async () => {
    const fixture = createComponent(MOCK_GAME);
    const component = fixture.componentInstance;

    component.gameName = '';
    component.teamA = 'Lions';
    component.teamB = 'Tigers';

    await component.saveGame('game-1');

    expect(serviceSpy.updateGameName).not.toHaveBeenCalled();
  });

  it('should call updateScore when changeScore is invoked', async () => {
    const fixture = createComponent(MOCK_GAME);
    await fixture.componentInstance.changeScore(MOCK_GAME, 'teamA', 1);

    expect(serviceSpy.updateScore).toHaveBeenCalledWith('game-1', 'teamA', 1);
  });

  it('should navigate home on goHome', async () => {
    const fixture = createComponent(MOCK_GAME);
    await fixture.componentInstance.goHome();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('should emit game undefined wrapped in loaded object when game is not found', (done) => {
    const fixture = createComponent(undefined);

    fixture.componentInstance.game$.subscribe((state) => {
      expect(state.loaded).toBeTrue();
      expect(state.game).toBeUndefined();
      done();
    });
  });
});
