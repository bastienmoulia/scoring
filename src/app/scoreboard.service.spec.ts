import { ScoreboardService } from './scoreboard.service';

describe('ScoreboardService', () => {
  it('should create game payload with initial scores and timestamps', async () => {
    const service = Object.create(ScoreboardService.prototype) as ScoreboardService & {
      addGameDocument: jasmine.Spy;
      getTimestamp: jasmine.Spy;
    };

    const createdAt = Symbol('createdAt');
    const updatedAt = Symbol('updatedAt');
    service.getTimestamp = jasmine.createSpy().and.returnValues(createdAt, updatedAt);
    service.addGameDocument = jasmine.createSpy().and.resolveTo({ id: 'game-1' });

    const gameId = await service.createGame('Finale', 'Lions', 'Tigers');

    expect(service.addGameDocument).toHaveBeenCalledWith({
      name: 'Finale',
      teams: {
        teamA: 'Lions',
        teamB: 'Tigers',
      },
      scores: {
        teamA: 0,
        teamB: 0,
      },
      createdAt,
      updatedAt,
    });
    expect(gameId).toBe('game-1');
  });

  it('should build atomic update payload for score changes', async () => {
    const service = Object.create(ScoreboardService.prototype) as ScoreboardService & {
      updateGameDocument: jasmine.Spy;
      getIncrement: jasmine.Spy;
      getTimestamp: jasmine.Spy;
    };

    const incrementToken = Symbol('incrementToken');
    const updatedAt = Symbol('updatedAt');

    service.getIncrement = jasmine.createSpy().and.returnValue(incrementToken);
    service.getTimestamp = jasmine.createSpy().and.returnValue(updatedAt);
    service.updateGameDocument = jasmine.createSpy().and.resolveTo();

    await service.updateScore('game-1', 'teamA', 2);

    expect(service.getIncrement).toHaveBeenCalledWith(2);
    expect(service.updateGameDocument).toHaveBeenCalledWith('game-1', {
      'scores.teamA': incrementToken,
      updatedAt,
    });
  });

  it('should update game name and timestamp', async () => {
    const service = Object.create(ScoreboardService.prototype) as ScoreboardService & {
      updateGameDocument: jasmine.Spy;
      getTimestamp: jasmine.Spy;
    };

    const updatedAt = Symbol('updatedAt');
    service.getTimestamp = jasmine.createSpy().and.returnValue(updatedAt);
    service.updateGameDocument = jasmine.createSpy().and.resolveTo();

    await service.updateGameName('game-1', 'Demi-finale');

    expect(service.updateGameDocument).toHaveBeenCalledWith('game-1', {
      name: 'Demi-finale',
      updatedAt,
    });
  });

  it('should update teams and timestamp', async () => {
    const service = Object.create(ScoreboardService.prototype) as ScoreboardService & {
      updateGameDocument: jasmine.Spy;
      getTimestamp: jasmine.Spy;
    };

    const updatedAt = Symbol('updatedAt');
    service.getTimestamp = jasmine.createSpy().and.returnValue(updatedAt);
    service.updateGameDocument = jasmine.createSpy().and.resolveTo();

    await service.updateTeams('game-1', 'Lions', 'Wolves');

    expect(service.updateGameDocument).toHaveBeenCalledWith('game-1', {
      teams: {
        teamA: 'Lions',
        teamB: 'Wolves',
      },
      updatedAt,
    });
  });
});
