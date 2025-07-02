class Screen
{
    constructor(mesh, scene)
	{
        this.mesh = mesh;
        this.texture = null;
        this.material = null;
        this.initialize(scene);
    }

    initialize(scene)
	{
        this.texture = new DynamicTexture(512, 512, scene);
        this.material = new ScreenMaterial(this.texture);
        this.setupMesh();
    }

    update(gameData)
	{
        // Sadece ekran güncelleme logic'i
    }
}
