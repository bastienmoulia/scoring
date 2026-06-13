import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { GameComponent } from './game.component';
import { Game, ScoreboardService, Team } from '../scoreboard.service';
import { RecentGamesService } from '../recent-games.service';

const MOCK_GAME: Game = {
  id: 'game-1',
  name: 'Finale',
  teams: [
    { name: 'Lions', color: '#0054e9', score: 3 },
    { name: 'Tigers', color: '#eb445a', score: 1 },
  ],
};

describe('GameComponent', () => {
  let serviceSpy: jasmine.SpyObj<ScoreboardService>;
  let routerSpy: jasmine.SpyObj<Router>;

  function createComponent(gameResult: Game | undefined) {
    serviceSpy = jasmine.createSpyObj<ScoreboardService>('ScoreboardService', [
      'getGameById',
      'updateScore',
    ]);
    serviceSpy.getGameById.and.returnValue(of(gameResult));
    serviceSpy.updateScore.and.resolveTo();

    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);
    routerSpy.navigate.and.resolveTo(true);

    const recentSpy = jasmine.createSpyObj<RecentGamesService>('RecentGamesService', [
      'track',
      'remove',
      'getAll',
    ]);
    recentSpy.track.and.resolveTo();
    recentSpy.remove.and.resolveTo();
    recentSpy.getAll.and.resolveTo([]);

    TestBed.configureTestingModule({
      imports: [GameComponent],
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

    return TestBed.createComponent(GameComponent);
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
      const recentSpy = TestBed.inject(RecentGamesService) as jasmine.SpyObj<RecentGamesService>;
      expect(recentSpy.track).toHaveBeenCalledWith({
        id: 'game-1',
        name: 'Finale',
        teams: MOCK_GAME.teams,
      });
      done();
    });
  });

  it('should call updateScore when changeScore is invoked', async () => {
    const fixture = createComponent(MOCK_GAME);
    await fixture.componentInstance.changeScore(MOCK_GAME, 0, 1);

    expect(serviceSpy.updateScore).toHaveBeenCalledWith('game-1', 0, 1, MOCK_GAME.teams);
  });

  it('should navigate home on goHome', async () => {
    const fixture = createComponent(MOCK_GAME);
    await fixture.componentInstance.goHome();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('should navigate to settings page on goSettings', async () => {
    const fixture = createComponent(MOCK_GAME);
    await fixture.componentInstance.goSettings('game-1');

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/game', 'game-1', 'settings']);
  });

  it('should display fallback game name from teams when game name is empty', () => {
    const fixture = createComponent({ ...MOCK_GAME, name: '' });
    expect(fixture.componentInstance.displayGameName({ ...MOCK_GAME, name: '' })).toBe(
      'Lions vs Tigers',
    );
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
