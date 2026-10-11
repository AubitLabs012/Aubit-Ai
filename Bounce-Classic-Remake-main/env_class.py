import pygame.sprite
from game_variables import *


# Define a tile class
class Tile(pygame.sprite.Sprite):
    def __init__(self, x, y, _tile_image):
        super().__init__()
        self.image = _tile_image
        self.rect = self.image.get_rect()
        self.rect.x = x
        self.rect.y = y


# Define a candle class
class Candle(pygame.sprite.Sprite):
    def __init__(self, x, y, _candle_image):
        super().__init__()
        self.image = _candle_image
        self.rect = self.image.get_rect()
        self.rect.x = x
        self.rect.y = y


class Thorn(pygame.sprite.Sprite):
    def __init__(self, x, y, up_bound, low_bound, speed, _thorn_image):
        super().__init__()
        self.image = _thorn_image
        self.rect = self.image.get_rect()
        self.y = y
        self.rect.x = x
        self.rect.y = y
        self.up_bound, self.low_bound = up_bound, low_bound
        self.speed = speed

    def update(self):
        if self.rect.y <= self.y - self.low_bound:
            self.speed *= -1
            self.rect.y += self.speed
        elif self.rect.y >= self.y + self.up_bound:
            self.speed *= -1
            self.rect.y += self.speed
        else:
            self.rect.y += self.speed
        return None


class Key(pygame.sprite.Sprite):
    def __init__(self, x, y, _key_image):
        super().__init__()
        self.image = _key_image
        self.rect = self.image.get_rect()
        self.rect.x = x
        self.rect.y = y

    def update(self):
        if pygame.sprite.spritecollideany(self, BALL_GROUP):
            pygame.mixer.Sound(KEY_GET_SOUND).play()
            self.kill()
        return None


class Pipe(pygame.sprite.Sprite):
    def __init__(self, x, y, _pipe_image):
        super().__init__()
        self.image = _pipe_image
        self.rect = self.image.get_rect()
        self.rect.x = x
        self.rect.y = y

    def update(self, character):
        if len(KEY_GROUP) == 0:
            self.image = pygame.transform.scale(pygame.image.load(PIPE_OPEN), (TILE_W, TILE_H)).convert_alpha()
            if pipe_collision := pygame.sprite.spritecollideany(self, BALL_GROUP):
                if self.rect.left - pipe_collision.rect.right < TILE_W//5 and character.change_x > 0:
                    pipe_collision.rect.right = self.rect.left + TILE_W//5
                    pipe_collision.win = True

                if self.rect.right - pipe_collision.rect.left < TILE_W//5 and character.change_x < 0:
                    pipe_collision.rect.left = self.rect.right - TILE_W//5
                    pipe_collision.win = True
        else:
            if pipe_collision := pygame.sprite.spritecollideany(self, BALL_GROUP):
                pipe_collision.rect.right = self.rect.left

        return None


class PowerGravity(pygame.sprite.Sprite):
    def __init__(self, x, y, _pg_image):
        super().__init__()
        self.image = _pg_image
        self.rect = self.image.get_rect()
        self.rect.x = x
        self.rect.y = y
        self.counter = 0

    def update(self, character):
        if character.pg_counter:
            if self.counter > 0:
                pygame.draw.rect(SCREEN, (255, 255, 0), pygame.Rect(0, SCREEN_HEIGHT - 5, self.counter, 5))
                self.counter -= SCREEN_WIDTH/500
                character.jump_strength = abs(character.jump_strength)
                if self.counter <= 0:
                    character.gravity = abs(character.gravity)
                    character.jump_strength = -abs(character.jump_strength)
                    self.counter = 0
                    character.pg_counter = False
        else:
            character.gravity = abs(character.gravity)
            character.jump_strength = -abs(character.jump_strength)
            self.counter = 0
        return None


class PowerSpeed(pygame.sprite.Sprite):
    def __init__(self, x, y, power_speed_image):
        super().__init__()
        self.image = power_speed_image
        self.rect = self.image.get_rect()
        self.rect.x = x
        self.rect.y = y
        self.counter = 0
        self.max_ball_speed = 2*BALL_SPEED
        self.max_scroll_rate = 2*SCROLL_RATE

    def update(self, character):
        if character.ps_counter:
            if self.counter > 0:
                pygame.draw.rect(SCREEN, (0, 181, 226), pygame.Rect(0, SCREEN_HEIGHT - 10, self.counter, 5))
                self.counter -= SCREEN_WIDTH / 500
                character.speed = 2 * BALL_SPEED
                character.scroll_rate = 2 * SCROLL_RATE
                if self.counter <= 0:
                    character.speed = BALL_SPEED
                    character.scroll_rate = SCROLL_RATE
                    self.counter = 0
                    character.ps_counter = False
        else:
            character.speed = BALL_SPEED
            self.counter = 0
            character.scroll_rate = SCROLL_RATE


class PowerJump(pygame.sprite.Sprite):
    def __init__(self, x, y, power_jump_image):
        super().__init__()
        self.image = power_jump_image
        self.rect = self.image.get_rect()
        self.rect.x = x
        self.rect.y = y
        self.counter = 0

    def update(self, character):
        if character.pj_counter:
            if self.counter > 0:
                pygame.draw.rect(SCREEN, (0, 0, 139), pygame.Rect(0, SCREEN_HEIGHT - 15, self.counter, 5))
                self.counter -= SCREEN_WIDTH / 500
                character.jump_strength = 2 * BALL_JUMP
                if self.counter <= 0:
                    if character.pop_image == POP_RED_IMAGE:
                        character.jump_strength = BALL_JUMP
                    elif character.pop_image == POP_STONE_IMAGE:
                        character.jump_strength = BALL_JUMP / 2
                    elif character.pop_image == POP_BEACH_IMAGE:
                        character.jump_strength = BALL_JUMP * 1.5
                    self.counter = 0
                    character.pj_counter = False

        else:
            if character.pop_image == POP_RED_IMAGE:
                character.jump_strength = BALL_JUMP
            elif character.pop_image == POP_STONE_IMAGE:
                character.jump_strength = BALL_JUMP/2
            elif character.pop_image == POP_BEACH_IMAGE:
                character.jump_strength = BALL_JUMP * 1.5
            self.counter = 0
