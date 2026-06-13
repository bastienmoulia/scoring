import { ScoreboardService } from './scoreboard.service';

describe('ScoreboardService', () => {
  it('should create game with a generated short id', async () => {
    const service = Object.create(ScoreboardService.prototype) as ScoreboardService & {
      generateShortGameId: jasmine.Spy;
      gameDocumentExists: jasmine.Spy;
      setGameDocument: jasmine.Spy;
      getTimestamp: jasmine.Spy;
    };

    const createdAt = Symbol('createdAt');
    const updatedAt = Symbol('updatedAt');
    service.generateShortGameId = jasmine.createSpy().and.returnValue('ABCD2345');
    service.gameDocumentExists = jasmine.createSpy().and.resolveTo(false);
    service.setGameDocument = jasmine.createSpy().and.resolveTo();
    service.getTimestamp = jasmine.createSpy().and.returnValues(createdAt, updatedAt);

    const teams = [
      { name: 'Lions', color: '#0054e9', score: 0 },
      { name: 'Tigers', color: '#eb445a', score: 0 },
    ];

    const gameId = await service.createGame('Finale', teams);

    expect(service.generateShortGameId).toHaveBeenCalled();
    expect(service.gameDocumentExists).toHaveBeenCalledWith('ABCD2345');
    expect(service.setGameDocument).toHaveBeenCalledWith('ABCD2345', {
      name: 'Finale',
      teams,
      createdAt,
      updatedAt,
    });
    expect(gameId).toBe('ABCD2345');
  });

  it('should retry id generation when collision occurs', async () => {
    const service = Object.create(ScoreboardService.prototype) as ScoreboardService & {
      generateShortGameId: jasmine.Spy;
      gameDocumentExists: jasmine.Spy;
      setGameDocument: jasmine.Spy;
      getTimestamp: jasmine.Spy;
    };

    const createdAt = Symbol('createdAt');
    const updatedAt = Symbol('updatedAt');
    service.generateShortGameId = jasmine.createSpy().and.returnValues('DUPLICAT', 'UNIQUE12');
    service.gameDocumentExists = jasmine
      .createSpy()
      .and.returnValues(Promise.resolve(true), Promise.resolve(false));
    service.setGameDocument = jasmine.createSpy().and.resolveTo();
    service.getTimestamp = jasmine.createSpy().and.returnValues(createdAt, updatedAt);

    const teams = [
      { name: 'Lions', color: '#0054e9', score: 0 },
      { name: 'Tigers', color: '#eb445a', score: 0 },
    ];

    const gameId = await service.createGame('Finale', teams);

    expect(service.generateShortGameId).toHaveBeenCalledTimes(2);
    expect(service.gameDocumentExists).toHaveBeenCalledWith('DUPLICAT');
    expect(service.gameDocumentExists).toHaveBeenCalledWith('UNIQUE12');
    expect(service.setGameDocument).toHaveBeenCalledTimes(1);
    expect(service.setGameDocument).toHaveBeenCalledWith('UNIQUE12', {
      name: 'Finale',
      teams,
      createdAt,
      updatedAt,
    });
    expect(gameId).toBe('UNIQUE12');
  });

  it('should build atomic update payload for score changes', async () => {
    const service = Object.create(ScoreboardService.prototype) as ScoreboardService & {
      updateGameDocument: jasmine.Spy;
      getTimestamp: jasmine.Spy;
    };

    const updatedAt = Symbol('updatedAt');

    service.getTimestamp = jasmine.createSpy().and.returnValue(updatedAt);
    service.updateGameDocument = jasmine.createSpy().and.resolveTo();

    const teams = [
      { name: 'Lions', color: '#0054e9', score: 3 },
      { name: 'Tigers', color: '#eb445a', score: 1 },
    ];

    await service.updateScore('game-1', 0, 2, teams);

    expect(service.updateGameDocument).toHaveBeenCalledWith('game-1', {
      teams: [
        { name: 'Lions', color: '#0054e9', score: 5 },
        { name: 'Tigers', color: '#eb445a', score: 1 },
      ],
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

    const teams = [
      { name: 'Lions', color: '#0054e9', score: 0 },
      { name: 'Wolves', color: '#10dc60', score: 0 },
    ];

    await service.updateTeams('game-1', teams);

    expect(service.updateGameDocument).toHaveBeenCalledWith('game-1', {
      teams,
      updatedAt,
    });
  });

  it('should normalize legacy game documents to the new team model', () => {
    const service = Object.create(ScoreboardService.prototype) as any;

    const normalized = service.normalizeGame({
      id: 'game-1',
      name: 'Finale',
      teams: {
        teamA: 'Lions',
        teamB: 'Tigers',
      },
      scores: {
        teamA: 3,
        teamB: 1,
      },
    }) as { teams: Array<{ name: string; color: string; score: number }> };

    expect(normalized.teams).toEqual([
      { name: 'Lions', color: '#0054e9', score: 3 },
      { name: 'Tigers', color: '#eb445a', score: 1 },
    ]);
  });
});
