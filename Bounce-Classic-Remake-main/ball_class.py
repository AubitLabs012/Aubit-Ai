from game_variables import *
import pygame


class Ball(pygame.sprite.Sprite):
    def __init__(self, ref_x, ref_y, sprite_list, _start_tile):
        super().__init__()
        self.image, self.length = sprite_list[0], len(sprite_list)  # Initial image as first image in sprite folder.
        self.sprites = sprite_list  # List of repeated-images rotated by some angle (default to 90)
        self.pointer = 0  # Points to the current image in list of images.
        self.rect = self.image.get_rect()
        self.spawn_pos_x = _start_tile.rect.x + ref_x  # Use to spawn the ball to the start tile location
        self.spawn_pos_y = _start_tile.rect.y - ref_y
        self.spawn_tile = _start_tile
        self.rect.x = _start_tile.rect.x + ref_x
        self.rect.y = _start_tile.rect.y - ref_y
        self.speed = BALL_SPEED
        self.jump_strength = BALL_JUMP
        self.change_x = 0
        self.change_y = 0
        self.gravity = 0.5
        self.bounce = 2
        self.pop_image = POP_RED_IMAGE  # Use to identify which ball is being used: Red, Stone, or Beach Ball
        self.pg_counter = False  # Set to True if Power Gravity effect is active, False otherwise
        self.ps_counter = False  # Set to True if Power Speed effect is active, False otherwise
        self.pj_counter = False  # Set to True if Power Speed effect is active, False otherwise
        self.scroll_rate = SCROLL_RATE
        self.win = False  # Sets to True if level is completed

    def respawn(self):
        """
        respawns the ball at self.spawn_pos_x, self.spawn_pos_y, and moves the background at SCROLL_RATE
        :return: None
        """
        while self.spawn_tile.rect.x < self.spawn_pos_x - 50:
            for group in [TILE_GROUP, CANDLE_GROUP, THORN_GROUP, KEY_GROUP, PIPE_GROUP]:
                for element in group:
                    element.rect.x += SCROLL_RATE
            draw_all(_ball_draw=False)
            pygame.display.update()

        while self.spawn_tile.rect.x > self.spawn_pos_x - 50:
            for group in [TILE_GROUP, CANDLE_GROUP, THORN_GROUP, KEY_GROUP, PIPE_GROUP]:
                for element in group:
                    element.rect.x -= SCROLL_RATE
            draw_all(_ball_draw=False)
            pygame.display.update()
        self.rect.x = self.spawn_pos_x
        self.rect.y = self.spawn_pos_y
        self.pg_counter = False
        self.ps_counter = False
        self.pj_counter = False

    def update(self):
        if self.change_x != 0:  # As change_x changes, self.image is updated to one rotated images in self.sprite.......
            self.pointer = (0 if self.pointer // 5 >= self.length - 1 else self.pointer + 1) if self.change_x > 0 else (
                (self.length - 1) * 5 if self.pointer <= 1 else self.pointer - 1)
        self.image = self.sprites[self.pointer // 5]
        # Final changes to ball position at x-axis
        self.rect.x += self.change_x if 0 <= (self.rect.x + self.change_x) <= SCREEN_WIDTH - BALL_W else 0

        # Check for horizontal collisions...............................................................................
        if pg_collision := pygame.sprite.spritecollideany(self, POWER_GRAVITY_GROUP):  # Collision with Power Gravity
            self.gravity = -abs(self.gravity)
            self.jump_strength = abs(self.jump_strength)
            pg_collision.counter = SCREEN_WIDTH
            self.pg_counter = True

        if ps_collision := pygame.sprite.spritecollideany(self, POWER_SPEED_GROUP):  # Collision with Power Speed
            ps_collision.counter = SCREEN_WIDTH
            self.speed = 2 * BALL_SPEED
            self.scroll_rate = 2 * SCROLL_RATE
            self.ps_counter = True

        if pj_collision := pygame.sprite.spritecollideany(self, POWER_JUMP_GROUP):  # Collision with Power Jump
            pj_collision.counter = SCREEN_WIDTH
            self.jump_strength = 2 * BALL_JUMP
            self.pj_counter = True

        if _tile := pygame.sprite.spritecollideany(self, TILE_GROUP):  # Check for Collision with Tile Group
            if self.change_x > 0:  # Moving right
                self.rect.right = _tile.rect.left
            elif self.change_x < 0:  # Moving left
                self.rect.left = _tile.rect.right
        # ..............................................................................................................

        if -500 <= (self.rect.y + self.change_y) < SCREEN_HEIGHT - BALL_H:
            self.change_y += self.gravity
            self.rect.y += self.change_y  # Final changes to ball position at y-axis
        else:
            self.change_y += self.gravity

        # Check for vertical collisions ................................................................................
        if pg_collision := pygame.sprite.spritecollideany(self, POWER_GRAVITY_GROUP):  # Collision with Power Gravity
            self.gravity = -abs(self.gravity)
            self.jump_strength = abs(self.jump_strength)
            pg_collision.counter = SCREEN_WIDTH
            self.pg_counter = True

        if ps_collision := pygame.sprite.spritecollideany(self, POWER_SPEED_GROUP):  # Collision with Power Speed
            ps_collision.counter = SCREEN_WIDTH
            self.speed = 2 * BALL_SPEED
            self.scroll_rate = 2 * SCROLL_RATE
            self.ps_counter = True

        if pj_collision := pygame.sprite.spritecollideany(self, POWER_JUMP_GROUP):  # Collision with Power Jump
            pj_collision.counter = SCREEN_WIDTH
            self.jump_strength = 2 * BALL_JUMP
            self.pj_counter = True

        if _tile := pygame.sprite.spritecollideany(self, TILE_GROUP):  # Check for Collision with Tile Group
            if self.rect.top < _tile.rect.top:  # Falling/Landed
                self.rect.bottom = _tile.rect.top
                self.change_y = self.bounce_effect()
            elif self.rect.bottom > _tile.rect.bottom:  # Jumping/Mid-air
                self.rect.top = _tile.rect.bottom
                self.change_y = self.bounce_effect()
        # ..............................................................................................................

        # # Check for collision with Candle and Thorn ..................................................................
        candle_collided = pygame.sprite.spritecollideany(self, CANDLE_GROUP)
        thorn_collided = pygame.sprite.spritecollideany(self, THORN_GROUP)

        if candle_collided and not thorn_collided and self.pop_image == POP_STONE_IMAGE:
            if (candle_collided.rect.top - self.rect.top) >= 5:  # Falling/Landed
                self.rect.bottom = candle_collided.rect.top
                self.change_y = self.bounce_effect()
            elif self.rect.left < candle_collided.rect.left:  # Moving right with lateral collide
                self.rect.right = candle_collided.rect.left
            elif self.rect.right > candle_collided.rect.right:  # Moving left with lateral collide
                self.rect.left = candle_collided.rect.right

        elif candle_collided or thorn_collided:
            self.pop()
        # ..............................................................................................................

    def bounce_effect(self):
        """
        Returns negative of change_y // bounce factor.
        :return: int
        """
        return 0 if abs(self.change_y) < 5 else -self.change_y//self.bounce

    def jump(self):
        self.rect.y += 2  # Move down a bit to check for ground
        if pygame.sprite.spritecollideany(self, TILE_GROUP) or (pygame.sprite.spritecollideany(self, CANDLE_GROUP) and
                                                                self.pop_image == POP_STONE_IMAGE):
            self.change_y = self.jump_strength
        self.rect.y -= 4  # Move up to check for ground
        if pygame.sprite.spritecollideany(self, TILE_GROUP) or (pygame.sprite.spritecollideany(self, CANDLE_GROUP) and
                                                                self.pop_image == POP_STONE_IMAGE):
            self.change_y = self.jump_strength
        self.rect.y += 2  # Move to original position

    def pop(self):
        pygame.mixer.Sound(POP_SOUND).play()
        # The image changes to ball by self.sprite[i]
        self.image = pygame.transform.scale(pygame.image.load(self.pop_image), (POP_W, POP_H)).convert_alpha()
        self.change_x = 0
        self.change_y = 0
        # Draw everything
        draw_all(_ball_draw=False)
        SCREEN.blit(self.image, self.rect.topleft)
        pygame.display.update()
        pygame.time.delay(2000)
        self.respawn()
        return True
