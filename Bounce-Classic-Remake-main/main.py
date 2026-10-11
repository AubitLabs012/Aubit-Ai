import sys
import pygame.time
from env_class import *
from ball_class import Ball
from game_variables import *

pygame.init()
pygame.mixer.init()
pygame.display.set_caption("Bounce-Remake")
pygame.display.set_icon(pygame.image.load(GAME_ICON))

# DEFAULT SCRIPT........................................................................................................
red_ball_images = create_rotated_images(BALL_RED, 4)
stone_ball_images = create_rotated_images(STONE_BALL, 4)
beach_ball_images = create_rotated_images(BEACH_BALL, 4)

tile_image = pygame.transform.scale(pygame.image.load(TILE), (TILE_W, TILE_H)).convert_alpha()
candle_image = pygame.transform.scale(pygame.image.load(CANDLE), (CANDLE_W, CANDLE_H)).convert_alpha()
thorn_image = pygame.transform.scale(pygame.image.load(THORN), (THORN_W, THORN_H)).convert_alpha()
key_image = pygame.transform.scale(pygame.image.load(KEY), (KEY_W, KEY_H)).convert_alpha()
pipe_image = pygame.transform.scale(pygame.image.load(PIPE_LOCK), (TILE_W, TILE_H)).convert_alpha()
power_gravity_image = pygame.transform.scale(pygame.image.load(POWER_GRAVITY), (TILE_W, TILE_H)).convert_alpha()
power_speed_image = pygame.transform.scale(pygame.image.load(POWER_SPEED), (TILE_W, TILE_H)).convert_alpha()
power_jump_image = pygame.transform.scale(pygame.image.load(POWER_JUMP), (TILE_W, TILE_H)).convert_alpha()

# ......................................................................................................................


def start_screen():
    BALL_GROUP.empty()
    TILE_GROUP.empty()

    menu_logo = pygame.transform.scale(pygame.image.load(LOGO_MENU), (300, 110)).convert_alpha()
    menu_button = pygame.transform.scale(pygame.image.load(PLAY_MENU), (180, 40)).convert_alpha()

    _tile_positions = [(50, 550), (100, 550), (150, 550), (200, 550), (250, 550), (300, 550), (350, 550), (400, 550),
                       (450, 550), (500, 550), (550, 550), (600, 550), (650, 550), (700, 550), (750, 550), (800, 550),
                       (850, 550), (900, 550), (950, 550), (1000, 550), (1050, 550), (1100, 550), (1150, 550)]
    for pos in _tile_positions:
        TILE_GROUP.add(Tile(*pos, tile_image))
    s_tile = Tile(0, 550, tile_image)
    TILE_GROUP.add(s_tile)

    ball = Ball(100, 650, red_ball_images, s_tile)
    BALL_GROUP.add(ball)

    clock = pygame.time.Clock()
    counter = 0
    while True:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                sys.exit()
            elif event.type == pygame.MOUSEBUTTONUP:
                mouse_pos = pygame.mouse.get_pos()
                if menu_button.get_rect(topleft=(950, 250)).collidepoint(mouse_pos):
                    TILE_GROUP.empty()
                    BALL_GROUP.empty()
                    return True

        BALL_GROUP.update()
        SCREEN.fill(BG_COLOR)
        SCREEN.blit(menu_logo, (10, 250))
        SCREEN.blit(menu_button, (950, 250))
        TILE_GROUP.draw(SCREEN)
        BALL_GROUP.draw(SCREEN)
        if counter >= 200:
            ball.jump()
            counter = 0
        else:
            counter += 1
        pygame.display.update()
        clock.tick(FPS)


def level_select():
    TILE_GROUP.empty()
    BALL_GROUP.empty()

    level_image = pygame.transform.scale(pygame.image.load(TILE), (100, 100)).convert_alpha()
    back_button = pygame.transform.scale(pygame.image.load(BACK_BUTTON), (50, 50)).convert_alpha()
    _level_positions = [(150, 100), (350, 100), (550, 100), (750, 100), (950, 100)]
    _tile_positions = [(1150, 550), (1100, 550), (1050, 550), (1000, 550), (950, 550), (900, 550), (850, 550),
                       (800, 550), (750, 550), (700, 550), (650, 550), (600, 550), (550, 550), (500, 550), (450, 550),
                       (400, 550), (350, 550), (300, 550), (250, 550), (200, 550), (150, 550), (100, 550), (50, 550),
                       (0, 550)]
    for pos in _tile_positions:
        TILE_GROUP.add(Tile(*pos, tile_image))
    TILE_GROUP.add(Tile(10, 450, back_button))
    box_numbers_str = [f"{i + 1:02d}" for i in range(5)]
    box_numbers = {pos: f"{i + 1:02d}" for i, pos in enumerate(_level_positions)}
    font = pygame.font.Font(None, 60)
    font.set_bold(True)

    for pos, number in zip(_level_positions, box_numbers_str):
        box_surface = level_image.copy()  # Create a copy of the level image
        text_surface = font.render(number, True, (255, 255, 255))  # Render the number as text
        text_rect = text_surface.get_rect(center=(50, 50))  # Position the text in the center of the box
        box_surface.blit(text_surface, text_rect)  # Blit the text onto the box surface
        TILE_GROUP.add(Tile(*pos, box_surface))

    clock = pygame.time.Clock()
    while True:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                sys.exit()
            elif event.type == pygame.MOUSEBUTTONUP:
                mouse_pos = pygame.mouse.get_pos()
                for pos, number in box_numbers.items():
                    if pygame.Rect(pos, (100, 100)).collidepoint(mouse_pos):
                        TILE_GROUP.empty()
                        return int(number)
                if pygame.Rect((10, 450), (50, 50)).collidepoint(mouse_pos):  # Back-button collision:
                    TILE_GROUP.empty()
                    return 0

        SCREEN.fill(BG_COLOR)
        TILE_GROUP.draw(SCREEN)
        pygame.display.update()
        clock.tick(FPS)


def end_level():
    BALL_GROUP.empty()
    TILE_GROUP.empty()
    pygame.mixer.Sound(LEVEL_COMPLETED_SOUND).play()
    win_button = pygame.image.load(WOOHOO_BUTTON)
    next_button = pygame.transform.scale(pygame.image.load(NEXT_BUTTON), (246, 50))
    retry_button = pygame.transform.scale(pygame.image.load(RETRY_BUTTON), (50, 50))
    level_select_button = pygame.transform.scale(pygame.image.load(LEVEL_SELECT_BTN), (50, 50))
    crown = pygame.image.load(CROWN)
    gray_surface = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT))
    gray_surface.fill((128, 128, 128))  # Gray color
    gray_surface.set_alpha(150)  # Adjust alpha (transparency)
    SCREEN.blit(gray_surface, (0, 0))
    SCREEN.blit(win_button, (SCREEN_WIDTH // 2 - 178, SCREEN_HEIGHT // 2 - 30))
    SCREEN.blit(crown, (SCREEN_WIDTH // 2 - 174, 100))
    next_rect = SCREEN.blit(next_button, (SCREEN_WIDTH // 2 - 123, SCREEN_HEIGHT // 2 + 75))
    retry_rect = SCREEN.blit(retry_button, (SCREEN_WIDTH // 2 - 178, SCREEN_HEIGHT // 2 + 75))
    level_rect = SCREEN.blit(level_select_button, (SCREEN_WIDTH // 2 + 128, SCREEN_HEIGHT // 2 + 75))

    pygame.display.update()
    while True:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                sys.exit()
            elif event.type == pygame.MOUSEBUTTONUP:
                mouse_pos = pygame.mouse.get_pos()
                if next_rect.collidepoint(mouse_pos):
                    return True, True
                elif retry_rect.collidepoint(mouse_pos):
                    return True, False
                elif level_rect.collidepoint(mouse_pos):
                    return False, False


def create_level(_ball_x, _ball_y, _start_tile, _tile_positions, _candle_positions, _thorn_positions, _key_positions,
                 _pipe_positions, _power_gravity_positions, _power_speed_positions, _power_jump_positions, frame=4):
    # empty all elements
    BALL_GROUP.empty()
    TILE_GROUP.empty()
    CANDLE_GROUP.empty()
    KEY_GROUP.empty()
    THORN_GROUP.empty()
    PIPE_GROUP.empty()
    POWER_GRAVITY_GROUP.empty()
    POWER_SPEED_GROUP.empty()
    POWER_JUMP_GROUP.empty()

    for pos in _tile_positions:
        _tile = Tile(*pos, tile_image)
        TILE_GROUP.add(_tile)

    _start_tile = Tile(*_start_tile, tile_image)
    TILE_GROUP.add(_start_tile)  # Adding start_tile, this will act as a reference for background scrolls
    # and initial respawn

    # Add candles to the group
    for pos in _candle_positions:
        _candle = Candle(*pos, candle_image)
        CANDLE_GROUP.add(_candle)

    # Add thorns to the group
    thorn_speed = THORN_SPEED
    for pos in _thorn_positions:
        thorn_speed *= -1
        _thorn = Thorn(*pos, THORN_UP_BOUND, THORN_LOW_BOUND, thorn_speed, thorn_image)
        THORN_GROUP.add(_thorn)

    for pos in _key_positions:
        _key = Key(*pos, key_image)
        KEY_GROUP.add(_key)

    for pos in _pipe_positions:
        _pipe = Pipe(*pos, pipe_image)
        PIPE_GROUP.add(_pipe)

    for pos in _power_gravity_positions:
        _p_gravity = PowerGravity(*pos, power_gravity_image)
        # for collision
        TILE_GROUP.add(_p_gravity)
        # for gravity and jump modification
        POWER_GRAVITY_GROUP.add(_p_gravity)

    for pos in _power_speed_positions:
        _p_speed = PowerSpeed(*pos, power_speed_image)
        # for collision
        TILE_GROUP.add(_p_speed)
        POWER_SPEED_GROUP.add(_p_speed)

    for pos in _power_jump_positions:
        _p_jump = PowerJump(*pos, power_jump_image)
        # for collision
        TILE_GROUP.add(_p_jump)
        POWER_JUMP_GROUP.add(_p_jump)

    character = Ball(_ball_x, _ball_y, red_ball_images, _start_tile)
    BALL_GROUP.add(character)

    # Game loop
    clock = pygame.time.Clock()
    while not character.win:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                sys.exit()
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_SPACE:
                    character.jump()
                elif event.key == pygame.K_LEFT:
                    character.change_x = -character.speed
                elif event.key == pygame.K_RIGHT:
                    character.change_x = character.speed
                elif event.key == pygame.K_1:
                    character.pop_image = convert_ball(character, red_ball_images, BALL_JUMP, 0.5 *
                                                       sign(character.gravity), 2, POP_RED_IMAGE)
                elif event.key == pygame.K_2:
                    character.pop_image = convert_ball(character, stone_ball_images, BALL_JUMP / 2, 1 *
                                                       sign(character.gravity), 3, POP_STONE_IMAGE)
                elif event.key == pygame.K_3:
                    character.pop_image = convert_ball(character, beach_ball_images, BALL_JUMP * 1.5, 0.30 *
                                                       sign(character.gravity), 2, POP_BEACH_IMAGE)
            elif event.type == pygame.KEYUP:
                if event.key in [pygame.K_LEFT, pygame.K_RIGHT]:
                    character.change_x = 0
        # Update character
        BALL_GROUP.update()
        THORN_GROUP.update()
        KEY_GROUP.update()
        PIPE_GROUP.update(character)
        move_background_at_x(character, _start_tile, frame)
        # Draw everything with adjusted positions
        draw_all()
        POWER_JUMP_GROUP.update(character)  # Keep above Power Gravity for proper sequence of variable updates.
        POWER_GRAVITY_GROUP.update(character)
        POWER_SPEED_GROUP.update(character)
        # Update the display
        pygame.display.update()
        # Cap the frame rate
        clock.tick(FPS)
    if character.win:
        return end_level()


def play_levels(_level_list, _start_index=0):
    for i in range(_start_index - 1, len(_level_list)):
        _ball_x, _ball_y, _start_tile, _tile_positions, _candle_positions, _thorn_positions, _key_positions, \
         _pipe_positions, _power_gravity_positions, _power_speed_positions, _power_jump_positions, \
         _frame = _level_list[i]
        # Argument sequence: _ball_x, _ball_y, _start_tile, _tile_positions, _candle_positions, _thorn_positions,
        # _key_positions, _pipe_positions, _power_gravity_positions, _power_speed_positions, frame=4
        to_play, is_next = create_level(_ball_x, _ball_y, _start_tile, _tile_positions, _candle_positions,
                                        _thorn_positions,
                                        _key_positions, _pipe_positions, _power_gravity_positions,
                                        _power_speed_positions, _power_jump_positions, _frame)
        if to_play and not is_next:
            while not is_next and to_play:
                to_play, is_next = create_level(_ball_x, _ball_y, _start_tile, _tile_positions, _candle_positions,
                                                _thorn_positions,
                                                _key_positions, _pipe_positions, _power_gravity_positions,
                                                _power_speed_positions, _power_jump_positions, _frame)
        if not to_play and not is_next:
            return False
    return True


if __name__ == '__main__':
    to_start = True
    while True:
        if to_start:
            start_screen()
        start_index = level_select()
        while not start_index:
            start_screen()
            start_index = level_select()
        level_list = [LEVEL_01, LEVEL_02, LEVEL_03, LEVEL_04, LEVEL_05]
        if play_levels(level_list, start_index):
            break
        to_start = False
    print('YOU WON ! THANKS FOR PLAYING :)')
