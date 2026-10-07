import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BotAvatarComponent } from './bot-avatar.component';
import { SoundService } from '../../../core/services/sound.service';

describe('BotAvatarComponent', () => {
  let component: BotAvatarComponent;
  let fixture: ComponentFixture<BotAvatarComponent>;
  let mockSoundService: any;

  beforeEach(async () => {
    mockSoundService = {
      playBotChirp: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [BotAvatarComponent],
      providers: [{ provide: SoundService, useValue: mockSoundService }],
    }).compileComponents();

    fixture = TestBed.createComponent(BotAvatarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the bot avatar component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default states', () => {
    expect(component.isOpen).toBe(false);
    expect(component.isNear()).toBe(false);
    expect(component.isHovered()).toBe(false);
    expect(component.pupilOffsetX()).toBe(0);
    expect(component.pupilOffsetY()).toBe(0);
  });

  it('should update hover states on mouse enter and leave', () => {
    component.onMouseEnter();
    expect(component.isHovered()).toBe(true);
    expect(component.isHappy()).toBe(true);

    component.onMouseLeave();
    expect(component.isHovered()).toBe(false);
    expect(component.isHappy()).toBe(false);
  });

  it('should trigger chirp sound and emit event on click', () => {
    const emitSpy = vi.spyOn(component.avatarClick, 'emit');
    const dummyEvent = new MouseEvent('click');

    component.onClickAvatar(dummyEvent);

    expect(mockSoundService.playBotChirp).toHaveBeenCalled();
    expect(emitSpy).toHaveBeenCalled();
    expect(component.isPressed()).toBe(true);
    expect(component.isWinking()).toBe(true);
  });
});
