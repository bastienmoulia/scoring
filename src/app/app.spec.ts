import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { App } from './app';
import { ScoreboardService } from './scoreboard.service';

describe('App', () => {
  let serviceSpy: jasmine.SpyObj<ScoreboardService>;

  beforeEach(async () => {
    serviceSpy = jasmine.createSpyObj<ScoreboardService>(
      'ScoreboardService',
      ['createGame', 'updateScore'],
      {
        availableTeams: ['Lions', 'Tigers'],
        games$: of([])
      }
    );
    serviceSpy.createGame.and.resolveTo();
    serviceSpy.updateScore.and.resolveTo();

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [{ provide: ScoreboardService, useValue: serviceSpy }]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should disable creation when teams are identical', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    app.gameName = 'Finale';
    app.selectedTeamA = 'Lions';
    app.selectedTeamB = 'Lions';

    expect(app.canCreateGame).toBeFalse();
  });


  it('should update team score through service', async () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    await app.changeScore(
      {
        id: 'game-1',
        name: 'Finale',
        teams: { teamA: 'Lions', teamB: 'Tigers' },
        scores: { teamA: 0, teamB: 0 }
      },
      'teamA',
      1
    );

    expect(serviceSpy.updateScore).toHaveBeenCalledWith('game-1', 'teamA', 1);
  });

  it('should create game with selected teams', async () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    app.gameName = 'Finale';
    app.selectedTeamA = 'Lions';
    app.selectedTeamB = 'Tigers';

    await app.createGame();

    expect(serviceSpy.createGame).toHaveBeenCalledWith('Finale', 'Lions', 'Tigers');
    expect(app.gameName).toBe('');
  });
});
