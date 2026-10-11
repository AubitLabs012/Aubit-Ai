import pygame
import sys
from game_variables import TILE_W
# Initialize Pygame
pygame.init()

# Constants
GRID_SIZE = TILE_W
GRID_WIDTH = 1200
GRID_HEIGHT = 600
GRID_COLOR = (255, 0, 0)  # Red
GRID_CLICKED_COLOR_1 = (0, 255, 0)  # Green
GRID_CLICKED_COLOR_2 = (0, 0, 255)  # Blue
GRID_CLICKED_COLOR_3 = (0, 255, 255)
KEY_COLOR = (255, 255, 0)
PIPE_COLOR = (255, 0, 255)
POWER_GRAVITY_COLOR = (200, 200, 200)
POWER_SPEED_COLOR = (255, 127, 0)
POWER_JUMP_COLOR = (0, 0, 139)

T_FRAME = 4
T_OFF = 50
C_OFF = 15
KEY_OFF = 5

GRID_OUTLINE_COLOR = (0, 0, 0)  # Black

# Create the screen
screen = pygame.display.set_mode((GRID_WIDTH, GRID_HEIGHT))
pygame.display.set_caption("Grid Clicker")


def _frame(frame, tile_b=None, candle_b=None, thorn_b=None, keys_b=None, pipes_b=None, power_gravity_b=None):
    num_rows = GRID_HEIGHT // GRID_SIZE
    num_cols = GRID_WIDTH // GRID_SIZE
    grid = [[GRID_COLOR] * num_cols for _ in range(num_rows)]
    clicked_boxes = []
    current_box = None
    tile_boxes, candle_boxes, thorn_boxes, keys, pipes, power_gravity, power_speed, power_jump = [], [], [], [], [], [], [], []
    while True:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                if clicked_boxes:
                    print(f"Clicked boxes: {len(clicked_boxes)}")
                    print(f"tile_positions = {tile_boxes}")
                    print(f"candle_positions = {candle_boxes}")
                    print(f"thorn_positions = {thorn_boxes}")
                    print(f"key_positions = {keys}")
                    print(f"pipe_positions = {pipes}")
                    print(f"power_gravity_positions = {power_gravity}")
                    print(f"power_speed_positions = {power_speed}")
                    print(f"power_jump_positions = {power_jump}")
                sys.exit()
            elif event.type == pygame.MOUSEBUTTONDOWN:
                x, y = pygame.mouse.get_pos()
                row = y // GRID_SIZE
                col = x // GRID_SIZE
                clicked_boxes.append((col, row))

                # Check mouse button type
                if event.button == 1:  # Left-click (tile)
                    grid[row][col] = GRID_CLICKED_COLOR_1
                    tile_boxes.append((col * GRID_SIZE + (frame*GRID_WIDTH), row * GRID_SIZE))  # TILE BOXES AT 1
                    current_box = tile_boxes
                elif event.button == 2:  # Middle-click (thorn)
                    grid[row][col] = GRID_CLICKED_COLOR_2
                    thorn_boxes.append(((col * GRID_SIZE + (frame*GRID_WIDTH)) - T_OFF, row * GRID_SIZE - T_OFF))  # THORN BOXED AT 2
                    current_box = thorn_boxes
                elif event.button == 3:  # Right-click (candle)
                    grid[row][col] = GRID_CLICKED_COLOR_3
                    candle_boxes.append(((col * GRID_SIZE + (frame*GRID_WIDTH)) + C_OFF, row * GRID_SIZE))  # CANDLE AT 3
                    current_box = candle_boxes

            elif event.type == pygame.KEYDOWN:
                x, y = pygame.mouse.get_pos()
                row = y // GRID_SIZE
                col = x // GRID_SIZE
                clicked_boxes.append((col, row))

                if event.key == pygame.K_0:
                    current_box.pop(-1)  # removes latest element
                    grid[row][col] = GRID_COLOR

                elif event.key == pygame.K_1:  # Keys
                    current_box = keys
                    grid[row][col] = KEY_COLOR
                    keys.append(((col * GRID_SIZE + (frame*GRID_WIDTH)) + KEY_OFF, row * GRID_SIZE))

                elif event.key == pygame.K_2:  # Power gravity
                    current_box = power_gravity
                    grid[row][col] = POWER_GRAVITY_COLOR
                    power_gravity.append(((col * GRID_SIZE + (frame*GRID_WIDTH)), row * GRID_SIZE))

                elif event.key == pygame.K_3:  # Power speed
                    current_box = power_speed
                    grid[row][col] = POWER_SPEED_COLOR
                    power_speed.append(((col * GRID_SIZE + (frame*GRID_WIDTH)), row * GRID_SIZE))

                elif event.key == pygame.K_4:  # Power jump
                    current_box = power_jump
                    grid[row][col] = POWER_JUMP_COLOR
                    power_jump.append(((col * GRID_SIZE + (frame*GRID_WIDTH)), row * GRID_SIZE))

                elif event.key == pygame.K_5:  # Pipe
                    current_box = pipes
                    grid[row][col] = PIPE_COLOR
                    pipes.append(((col * GRID_SIZE + (frame*GRID_WIDTH)), row * GRID_SIZE))

                elif event.key == pygame.K_RIGHT:
                    print(f"Clicked boxes: {len(clicked_boxes)}")
                    print(f"tile_positions = {tile_boxes}")
                    print(f"candle_positions = {candle_boxes}")
                    print(f"thorn_positions = {thorn_boxes}")
                    print(f"key_positions = {keys}")
                    print(f"pipe_positions = {pipes}")
                    print(f"power_gravity_positions = {power_gravity}")
                    print(f"power_jump_positions = {power_jump}")
                    return tile_boxes, candle_boxes, thorn_boxes, keys, pipes, power_gravity, power_speed, power_jump

        # Draw the grid
        for row in range(num_rows):
            for col in range(num_cols):
                rect = pygame.Rect(col * GRID_SIZE, row * GRID_SIZE, GRID_SIZE, GRID_SIZE)
                pygame.draw.rect(screen, grid[row][col], rect)
                pygame.draw.rect(screen, GRID_OUTLINE_COLOR, rect, 1)  # Add black outline

        pygame.display.flip()


if __name__ == '__main__':
    t_tiles, t_candles, t_thorns, t_keys, t_pipes, t_power_gravity, t_power_speed, t_power_jump = [], [], [], [], [], \
                                                                                                  [], [], []
    S_FRAME = 4
    T_FRAME = 5
    for i in range(S_FRAME, T_FRAME):
        tile_boxes, candle_boxes, thorn_boxes, keys, pipes, power_gravity, power_speed, power_jump = _frame(i)
        t_tiles.extend(tile_boxes)
        t_candles.extend(candle_boxes)
        t_thorns.extend(thorn_boxes)
        t_keys.extend(keys)
        t_pipes.extend(pipes)
        t_power_gravity.extend(power_gravity)
        t_power_speed.extend(power_speed)
        t_power_jump.extend(t_power_jump)
    print('\n\n\n')
    print(f"tile_positions = {t_tiles}")
    print(f"candle_positions = {t_candles}")
    print(f"thorn_positions = {t_thorns}")
    print(f"key_positions = {t_keys}")
    print(f"pipe_positions = {t_pipes}")
    print(f"power_gravity_positions = {t_power_gravity}")
    print(f"power_speed_positions = {t_power_speed}")
    print(f"power_jump_positions = {t_power_jump}")



