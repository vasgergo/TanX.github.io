export class Overlappable {

    static overlap(param1, param2) {
        if (Array.isArray(param2)) {
            if (Array.isArray(param2[0])) {
                for (let i = 0; i < param2.length; i++) {
                    for (let j = 0; j < param2[i].length; j++) {
                        if (param1.x < param2[i][j].x + param2[i][j].width &&
                            param1.x + param1.width > param2[i][j].x &&
                            param1.y < param2[i][j].y + param2[i][j].height &&
                            param1.y + param1.height > param2[i][j].y) {
                            return {
                                isOverlap: true,
                                overlapWith: param2[i][j],
                            }
                        }
                    }
                }
                return false;
            }
            for (let i = 0; i < param2.length; i++) {
                if (param1.x < param2[i].x + param2[i].width &&
                    param1.x + param1.width > param2[i].x &&
                    param1.y < param2[i].y + param2[i].height &&
                    param1.y + param1.height > param2[i].y) {
                    return {
                        isOverlap: true,
                        overlapWith: param2[i],
                    }
                }
            }
            return false;
        } else {
            return param1.x < param2.x + param2.width &&
                param1.x + param1.width > param2.x &&
                param1.y < param2.y + param2.height &&
                param1.y + param1.height > param2.y;
        }

    }
}